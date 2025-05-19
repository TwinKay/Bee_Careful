/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 설정
firebase.initializeApp({
  apiKey: 'AIzaSyAhGAlaFN-4vUOJ0rK-Nc-ZEbhU8D_WnVc',
  authDomain: 'beecareful-b382a.firebaseapp.com',
  projectId: 'beecareful-b382a',
  storageBucket: 'beecareful-b382a.firebasestorage.app',
  messagingSenderId: '888984986723',
  appId: '1:888984986723:web:8a56077aba1f68ec548456',
});

const messaging = firebase.messaging();

// IndexedDB 설정
const DB_NAME = 'notifications-db';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';

// IndexedDB 열기 또는 생성
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // notifications 스토어가 없으면 생성
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        // 인덱스 생성
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('read', 'read', { unique: false });

        console.log('[IndexedDB] Notification store created');
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Error opening database:', event.target.error);
      reject(event.target.error);
    };
  });
};

// FCM 메시지를 NotificationType으로 변환하는 함수
const convertMessageToNotification = (payload) => {
  // FCM 페이로드 구조에 따라 데이터 추출
  const title = payload.notification?.title || payload.data?.alertTitle || '새 알림';
  const body = payload.notification?.body || payload.data?.alertBody || '';

  // 데이터 필드 생성
  let dataField = undefined;
  try {
    // payload.data에서 필요한 정보 추출
    if (payload.data && typeof payload.data.beehiveId === 'string') {
      dataField = {
        beehiveId: payload.data.beehiveId,
        message: payload.data.message || body,
        status: payload.data.status || 'warning', // 'warning', 'success', 'danger' 중 하나
      };
    }
  } catch (error) {
    console.error('[Service Worker] 알림 데이터 파싱 실패:', error);
  }

  // NotificationType 형식으로 반환
  return {
    id: payload.messageId || `notification_${Date.now()}`,
    title,
    body,
    data: dataField,
    read: false,
    createdAt: new Date().toISOString(),
  };
};

// 알림 메시지 저장 함수
const saveNotification = async (payload) => {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // NotificationType 형식으로 변환
      const notification = convertMessageToNotification(payload);

      const request = store.put(notification);

      request.onsuccess = () => {
        console.log('[IndexedDB] Notification saved:', notification);
        resolve(notification);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error saving notification:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Save notification error:', error);
    return null;
  }
};

// 백그라운드 메시지 처리
messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  // IndexedDB에 알림 저장
  const savedNotification = await saveNotification(payload);
  console.log('[firebase-messaging-sw.js] 저장된 알림:', savedNotification);

  // 브라우저 알림 표시
  const notificationTitle = savedNotification?.title || payload.data?.alertTitle || '새 알림';
  const notificationOptions = {
    body: savedNotification?.body || payload.data?.alertBody || '새 메시지가 도착했습니다',
    icon: '/icons/beecareful-192x192.png', // PWA 아이콘 경로
    tag: savedNotification?.id || 'fcm-notification',
    badge: '/icons/beehive-badge.png',
    data: {
      notificationId: savedNotification?.id, // 클릭 이벤트에서 사용할 알림 ID
      url: payload.data?.url || '/', // 클릭 시 이동할 URL
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Service Worker 활성화 즉시 처리
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 설치됨');
  self.skipWaiting(); // 대기 없이 활성화
});

// 활성화 이벤트 처리 - 모든 클라이언트 제어 획득
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 활성화됨');
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;

    console.log('[SW] 포그라운드 알림 표시 요청 수신:', title, options);

    // 알림 표시
    self.registration.showNotification(title, options);
  }
});

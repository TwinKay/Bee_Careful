'use client';

import type React from 'react';

import { useEffect } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { useGetFCMToken, useSaveFCMToken, setupMessageListener } from '@/apis/notification';
import useNotificationStore from '@/store/notificationStore';
import type { NotificationType, NotificationDataType } from '@/store/notificationStore';

// FCM 메시지를 NotificationType으로 변환하는 함수
const convertMessageToNotification = (payload: MessagePayload): NotificationType => {
  // FCM 페이로드 구조에 따라 데이터 추출
  const title = payload.notification?.title || payload.data?.alertTitle || '새 알림';
  const body = payload.notification?.body || payload.data?.alertBody || '';

  // 데이터 필드 파싱
  let dataField: NotificationDataType | undefined;
  try {
    // data 필드가 문자열인 경우 파싱 시도
    if (payload.data && typeof payload.data.beehiveId === 'string') {
      dataField = {
        beehiveId: payload.data.beehiveId,
        message: payload.data.message || body,
        status: (payload.data.status as 'WARNING' | 'SUCCESS' | 'DANGER') || 'WARNING',
      };
    }
  } catch (error) {
    console.error('알림 데이터 파싱 실패:', error);
  }

  return {
    id: payload.messageId || `notification_${Date.now()}`,
    title,
    body,
    data: dataField,
    read: false, // 새 알림은 항상 읽지 않음 상태로 설정
    createdAt: new Date().toISOString(),
  };
};

// IndexedDB에 알림 저장 함수
const saveNotificationToDB = async (notification: NotificationType): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('notifications-db', 1);

      // DB 처음 열 때 스토어 생성
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 스토어가 없으면 생성
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('read', 'read', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');

        // ID가 없으면 생성
        if (!notification.id) {
          notification.id = `notification_${Date.now()}`;
        }

        // 명시적으로 read 속성이 없으면 false로 설정
        if (notification.read === undefined) {
          notification.read = false;
        }

        const putRequest = store.put(notification);

        putRequest.onsuccess = () => {
          resolve(true);
        };

        putRequest.onerror = (error) => {
          reject(error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };

      request.onerror = (event) => {
        reject(event);
      };
    } catch (error) {
      reject(error);
    }
  });
};

const NotificationManager: React.FC = () => {
  const { data: fcmToken } = useGetFCMToken();
  const { mutate: saveFCMToken } = useSaveFCMToken();
  const { fetchNotifications } = useNotificationStore();

  // IndexedDB 초기화
  useEffect(() => {
    const initializeDB = async () => {
      try {
        const request = indexedDB.open('notifications-db', 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('notifications')) {
            const store = db.createObjectStore('notifications', { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('read', 'read', { unique: false });
          }
        };

        request.onerror = (event) => {
          console.error('IndexedDB 초기화 오류:', event);
        };
      } catch (error) {
        console.error('IndexedDB 초기화 중 오류:', error);
      }
    };

    initializeDB();
  }, []);

  // 알림 권한 요청
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        // 이미 권한이 있는지 확인
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          // 권한 요청
          try {
            const permission = await Notification.requestPermission();
            console.log('알림 권한 상태:', permission);
          } catch (error) {
            console.error('알림 권한 요청 중 오류:', error);
          }
        }
      }
    };

    requestNotificationPermission();
  }, []);

  // FCM 토큰이 있으면 서버에 저장
  useEffect(() => {
    if (fcmToken) {
      saveFCMToken(fcmToken);
    }
  }, [fcmToken, saveFCMToken]);

  // 포그라운드 메시지 리스너 설정
  useEffect(() => {
    const unsubscribe = setupMessageListener(async (payload: MessagePayload) => {
      console.log('포그라운드 메시지 수신:', payload);

      // 알림 객체 생성 및 IndexedDB에 저장
      const notification = convertMessageToNotification(payload);

      // 명시적으로 read: false 설정 (이미 convertMessageToNotification에서 설정되어 있지만 확실히 하기 위해)
      notification.read = false;

      try {
        // IndexedDB에 저장
        await saveNotificationToDB(notification);

        // Zustand 스토어 갱신
        fetchNotifications();

        // 브라우저 알림 표시 (옵션)
        if ('Notification' in window && Notification.permission === 'granted') {
          // 안전하게 알림 생성
          const browserNotification = new Notification(notification.title, {
            body: notification.body,
            icon: '/icons/beecareful-192x192.png',
          });

          // 알림 클릭 이벤트 처리
          browserNotification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            browserNotification.close();
          };
        }
      } catch (error) {
        console.error('알림 처리 중 오류:', error);
      }
    });

    // 백그라운드에서 포그라운드로 전환 시 알림 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('앱이 포그라운드로 전환됨');
        // IndexedDB에서 알림 불러오기
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 앱 시작 시 알림 목록 로드
    fetchNotifications();

    // 컴포넌트가 언마운트될 때 리스너 해제
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]); // notifications 의존성 제거

  return null;
};

export default NotificationManager;

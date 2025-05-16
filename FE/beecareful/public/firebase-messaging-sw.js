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

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.alert.title;
  const notificationOptions = {
    body: payload.alert.body,
    icon: '/icons/beecareful-192x192.png', // PWA 아이콘 경로
    tag: payload.messageId || 'fcm-notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification
  clients.openWindow('/'); // Open a specific page
});

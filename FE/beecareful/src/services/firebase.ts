import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyAhGAlaFN-4vUOJ0rK-Nc-ZEbhU8D_WnVc',
  authDomain: 'beecareful-b382a.firebaseapp.com',
  projectId: 'beecareful-b382a',
  storageBucket: 'beecareful-b382a.firebasestorage.app',
  messagingSenderId: '888984986723',
  appId: '1:888984986723:web:8a56077aba1f68ec548456',
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging };

import type { MessagePayload } from 'firebase/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/services/firebase';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/apis/api';

// FCM 토큰 가져오기
export function useGetFCMToken() {
  return useQuery({
    queryKey: ['fcmToken'],
    queryFn: async (): Promise<string | null> => {
      try {
        // 서비스 워커 등록 확인
        if (!('serviceWorker' in navigator)) {
          console.error('이 브라우저는 서비스 워커를 지원하지 않습니다.');
          return null;
        }

        // 서비스 워커 등록 확인
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        console.log('서비스 워커 등록 완료:', registration);

        // 브라우저 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('알림 권한이 거부됨');
          return null;
        }

        // FCM 토큰 가져오기
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        console.log('FCM 토큰:', token);
        return token;
      } catch (error) {
        console.error('FCM 토큰 가져오기 오류:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

// FCM 토큰 서버 저장 훅
export function useSaveFCMToken() {
  return useMutation({
    mutationFn: (token: string) => api.post('/users/fcm-token', { token }).then((res) => res.data),
  });
}

export const setupMessageListener = (callback: (payload: MessagePayload) => void) => {
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      // 페이로드 데이터 처리
      callback(payload);

      if (Notification.permission === 'granted') {
        // 알림 표시 (모바일에서도 작동)
        if (navigator.serviceWorker.controller) {
          // 서비스 워커를 통한 알림 표시
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title: payload.notification?.title || '새 알림',
              options: {
                body: payload.notification?.body || '새 메시지가 도착했습니다',
                icon: '/icons/beecareful-192x192.png',
                badge: '/icons/beehive-badge.png',
                tag: payload.messageId || 'fcm-notification',
                data: payload.data,
                requireInteraction: true,
              },
            },
          });
        } else {
          // 서비스 워커가 없는 경우 직접 알림 표시 (폴백)
          const title = payload.notification?.title || '새 알림';
          const options = {
            body: payload.notification?.body || '새 메시지가 도착했습니다',
            icon: '/icons/beecareful-192x192.png',
            badge: '/icons/beehive-badge.png',
            tag: payload.messageId || 'fcm-notification',
            requireInteraction: true,
          };
          new Notification(title, options);
        }
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('FCM 메시지 리스너 설정 실패:', error);
    return undefined;
  }
};

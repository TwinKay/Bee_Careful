import type { MessagePayload } from 'firebase/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// 알림 타입
export type NotificationType = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
};

// FCM 토큰 가져오기
export function useGetFCMToken() {
  return useQuery({
    queryKey: ['fcmToken'],
    queryFn: async (): Promise<string | null> => {
      // 브라우저에서 알림 권한 요청
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        console.log('FCM 토큰:', token);
        return token;
      }

      return null;
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

// FCM 토큰 서버 저장 훅
/**
 *
 * @todo 백엔드 API 개발 후 실제 url로 변경 필요
 */
export function useSaveFCMToken() {
  return useMutation({
    mutationFn: (token: string) => api.post('/users/fcm-token', { token }).then((res) => res.data),
  });
}

// 포그라운드 메시지 처리를 위한 리스너
export const setupMessageListener = (callback: (payload: MessagePayload) => void) => {
  return onMessage(messaging, callback);
};

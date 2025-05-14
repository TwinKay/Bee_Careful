import { useEffect } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { useGetFCMToken, useSaveFCMToken, setupMessageListener } from '@/apis/notification';

const NotificationManager: React.FC = () => {
  const { data: fcmToken } = useGetFCMToken();
  const { mutate: saveFCMToken } = useSaveFCMToken();

  // FCM 토큰이 있으면 서버에 저장
  useEffect(() => {
    if (fcmToken) {
      saveFCMToken(fcmToken);
    }
  }, [fcmToken, saveFCMToken]);

  // 포그라운드 메시지 리스너 설정
  useEffect(() => {
    const unsubscribe = setupMessageListener((payload: MessagePayload) => {
      // 알림 표시 (브라우저 알림)
      if (payload.notification && Notification.permission === 'granted') {
        new Notification(payload.notification.title || '새 알림', {
          body: payload.notification.body,
        });
      }
    });

    // 컴포넌트가 언마운트될 때 리스너 해제
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return null;
};

export default NotificationManager;

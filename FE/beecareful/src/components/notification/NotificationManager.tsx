import { useEffect } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { useGetFCMToken, useSaveFCMToken, setupMessageListener } from '@/apis/notification';

const NotificationManager: React.FC = () => {
  const { data: fcmToken } = useGetFCMToken();
  const { mutate: saveFCMToken } = useSaveFCMToken();

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
    const unsubscribe = setupMessageListener((payload: MessagePayload) => {
      console.log('포그라운드 메시지 수신:', payload);

      // 알림 표시 (브라우저 알림)
      try {
        if (
          payload.notification &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          // 브라우저 환경인지 확인
          if (typeof window !== 'undefined' && window.document) {
            // 안전하게 알림 생성
            const notification = new Notification(payload.notification.title || '새 알림', {
              body: payload.notification.body || '',
              icon: '/icons/beecareful-192x192.png', // 아이콘 경로 지정
            });

            // 알림 클릭 이벤트 처리 (선택 사항)
            notification.onclick = (event) => {
              event.preventDefault();
              // 알림 클릭 시 특정 페이지로 이동하려면 추가
              if (payload.data?.link) {
                window.open(payload.data.link, '_blank');
              } else {
                window.focus();
              }
              notification.close();
            };
          }
        }
      } catch (error) {
        console.error('알림 표시 중 오류 발생:', error);
        if (payload.notification) {
          // 여기서 토스트 알림 등 인앱 알림을 대신 표시
          console.log('대체 인앱 알림:', payload.notification.title);
        }
      }
    });

    // 백그라운드에서 포그라운드로 전환 시 이벤트 처리
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('앱이 포그라운드로 전환됨');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 컴포넌트가 언마운트될 때 리스너 해제
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};

export default NotificationManager;

import { useState, useEffect, useRef } from 'react';
import RemixIcon from '@/components/common/RemixIcon';
import { formatTimeAgo } from '@/utils/format';
import useNotificationStore from '@/store/notificationStore';
import type { NotificationType } from '@/store/notificationStore';

const NotificationBanner = () => {
  const { notifications, fetchNotifications } = useNotificationStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(true);
  const [slideIn, setSlideIn] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 컴포넌트 마운트 시 알림 데이터 가져오기
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 초기 알림 로드 후 슬라이드 인 애니메이션 트리거
  useEffect(() => {
    if (notifications.length > 0) {
      // 처음 마운트될 때 알림이 아래에서 위로 슬라이드되는 효과
      setSlideIn(true);
    }
  }, [notifications.length]);

  // 알림 순환 관리
  useEffect(() => {
    // 알림이 없으면 아무것도 하지 않음
    if (notifications.length === 0) return;

    // 알림이 1개뿐이면 순환하지 않음
    if (notifications.length <= 1) return;

    // 타이머 관리 및 알림 순환 함수
    const rotateNotification = () => {
      // 현재 알림 페이드 아웃
      setShowNotification(false);

      // 페이드 아웃 완료 후 다음 알림으로 변경
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % notifications.length);

        // 잠시 후 새 알림 슬라이드 인
        setTimeout(() => {
          setSlideIn(false); // 슬라이드 효과를 위해 초기화

          // DOM 업데이트 후 슬라이드 인 효과 적용
          setTimeout(() => {
            setSlideIn(true);
            setShowNotification(true);
          }, 50);
        }, 50);
      }, 300);
    };

    // 5초마다 알림 순환
    timerRef.current = window.setTimeout(rotateNotification, 5000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notifications, currentIndex]);

  // 알림이 없을 때
  if (notifications.length === 0) {
    return null;
  }

  // 현재 표시할 알림
  const currentNotification = notifications[currentIndex];

  // 알림 상태에 따른 아이콘과 색상 설정
  const getStatusIcon = (notification: NotificationType): { icon: string; color: string } => {
    switch (notification?.data?.status) {
      case 'WARNING':
        return { icon: 'ri-alert-fill', color: 'text-yellow-500' };
      case 'DANGER':
        return { icon: 'ri-error-warning-fill', color: 'text-red-500' };
      case 'SUCCESS':
        return { icon: 'ri-checkbox-circle-fill', color: 'text-green-500' };
      default:
        return { icon: 'ri-checkbox-circle-fill', color: 'text-blue-500' };
    }
  };

  const { icon, color } = getStatusIcon(currentNotification);

  return (
    <div className="h-11 w-80 overflow-hidden rounded-full bg-gray-100 px-4 py-2">
      <div className="relative h-full w-full overflow-hidden">
        <div
          className={`
            flex transform 
            items-center transition-all duration-300 ease-out
            ${showNotification ? 'opacity-100' : 'opacity-0'}
            ${slideIn ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          <RemixIcon name={icon} className={`${color} text-md`} />
          <p className="ml-2 flex-1 truncate text-left font-bold text-gray-600">
            {currentNotification.data
              ? `${currentNotification.data.beehiveId}벌통: ${currentNotification.data?.message}`
              : `${currentNotification.title}`}
          </p>
          <span className="ml-2 whitespace-nowrap text-sm text-gray-400">
            {formatTimeAgo(currentNotification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;

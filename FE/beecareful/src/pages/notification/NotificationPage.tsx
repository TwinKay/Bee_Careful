import { useHeaderIcon } from '@/hooks/useHeaderIcon';
import type { HeaderIconOptionType } from '@/layouts/MainLayout';
import { useRef, useEffect, useState } from 'react';
import NotificationItem from '@/components/notification/NotificationItem';
import useNotificationStore from '@/store/notificationStore';
import RemixIcon from '@/components/common/RemixIcon';

const NotificationListPage = () => {
  const pageTitle = '알림함';
  const headerOption = useRef<HeaderIconOptionType>({ title: pageTitle });

  // 현재 세션에서 처음 본 알림 ID를 저장하는 상태
  const [initialUnreadIds, setInitialUnreadIds] = useState<Set<string>>(new Set());

  // 초기 로드 완료 여부
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 알림 스토어에서 데이터 가져오기
  const { notifications, loading, error, fetchNotifications, markAsRead } = useNotificationStore();

  // 컴포넌트 마운트 시 알림 데이터 가져오기
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 알림 데이터가 로드된 후 읽지 않은 알림 ID 저장
  useEffect(() => {
    if (!loading && notifications.length > 0 && !initialLoadComplete) {
      // 읽지 않은 알림 ID를 추출하여 initialUnreadIds에 저장
      const unreadIds = new Set<string>();
      notifications.forEach((notification) => {
        if (notification.id && notification.read === false) {
          unreadIds.add(notification.id);
        }
      });
      setInitialUnreadIds(unreadIds);
      setInitialLoadComplete(true);
    }
  }, [loading, notifications, initialLoadComplete]);

  // 페이지를 나갈 때 모든 알림을 읽음 처리
  useEffect(() => {
    return () => {
      // 읽지 않은 알림만 읽음 처리
      notifications.forEach((notification) => {
        if (notification.id && notification.read === false) {
          markAsRead(notification.id);
        }
      });
    };
  }, [notifications, markAsRead]);

  // 알림 클릭 시 읽음 처리 함수
  const handleNotificationClick = async (id: string) => {
    if (id) {
      await markAsRead(id);
      // initialUnreadIds에서 제거 (UI 업데이트를 위해)
      setInitialUnreadIds((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };

  useHeaderIcon(headerOption);

  // 로딩 중일 때 로딩 표시
  if (loading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center">
        <div className="mb-3 animate-spin text-yellow-500">
          <RemixIcon name="ri-refresh-line" className="text-2xl" />
        </div>
        <p className="text-gray-500">알림을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생 시 에러 메시지 표시
  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-500">
        <p>알림을 불러오는 중 오류가 발생했습니다</p>
        <button
          onClick={() => fetchNotifications()}
          className="mx-auto mt-2 flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-white"
        >
          <RemixIcon name="ri-refresh-line" className="mr-1" /> 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {notifications && notifications.length > 0 ? (
        <div className="w-full">
          {notifications.map((notification) => {
            // 이 알림이 페이지 진입 시 읽지 않은 상태였는지 확인
            const wasInitiallyUnread = notification.id
              ? initialUnreadIds.has(notification.id)
              : false;

            // 페이지 진입 시 읽지 않은 상태였으면 흰색 배경, 아니면 회색 배경
            const bgColor = wasInitiallyUnread ? 'bg-white' : 'bg-gray-50';

            return (
              <div
                key={notification.id}
                className={`w-full border-b border-gray-100 px-8 py-4 ${bgColor}`}
                onClick={() => notification.id && handleNotificationClick(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <NotificationItem notification={notification} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 text-center text-sm text-gray-400">
        최대 7일전 알림까지 확인 가능합니다
      </div>
    </div>
  );
};

export default NotificationListPage;

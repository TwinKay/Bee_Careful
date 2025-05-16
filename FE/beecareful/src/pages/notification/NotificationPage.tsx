import { useHeaderIcon } from '@/hooks/useHeaderIcon';
import type { HeaderIconOptionType } from '@/layouts/MainLayout';
import { useRef } from 'react';
import type { NotificationType } from '@/types/notification';
import NotificationItem from '@/components/notification/NotificationItem';

const NotificationListPage = () => {
  const pageTitle = '알림함';
  const headerOption = useRef<HeaderIconOptionType>({ title: pageTitle });

  const mockNotifications: NotificationType[] = [
    {
      id: '3',
      title: '장수말벌이 출몰하였습니다.',
      body: '',
      data: {
        beehiveId: '벌통3',
        message: '',
        status: 'warning',
      },
      read: false,
      createdAt: '2025-05-16T14:50:00Z',
    },
    {
      id: '2',
      title: '질병 검사를 완료하였습니다',
      body: '',
      data: {
        beehiveId: '벌통3',
        message: '질병 감지',
        status: 'danger',
      },
      read: false,
      createdAt: '2025-05-16T00:50:00Z',
    },
    {
      id: '1',
      title: '질병 검사를 완료하였습니다',
      body: '',
      data: {
        beehiveId: '벌통2',
        message: '정상',
        status: 'success',
      },
      read: false,
      createdAt: '2025-05-15T14:30:00Z',
    },
  ];

  useHeaderIcon(headerOption);

  return (
    <div className="w-full">
      <div className="space-y-0">
        {mockNotifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        최대 7일전 알림까지 확인 가능합니다
      </div>
    </div>
  );
};

export default NotificationListPage;

import RemixIcon from '@/components/common/RemixIcon';
import type { NotificationType } from '@/store/notificationStore';
import { formatTimeAgo } from '@/utils/format';

type NotificationItemPropsType = {
  notification: NotificationType;
};

const NotificationItem = ({ notification }: NotificationItemPropsType) => {
  // 상태에 따른 아이콘과 색상 설정
  const getStatusIcon = (): { icon: string; color: string } => {
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

  const { icon, color } = getStatusIcon();

  // 결과 텍스트 색상 설정
  const getResultTextColor = (): string => {
    if (notification?.data?.status === 'DANGER') return 'text-red-500';
    if (notification?.data?.status === 'SUCCESS') return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <>
      <div className={`${color}`}>
        <RemixIcon name={icon} className="text-xl" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-bc-brown-100">
            {notification.data?.nickname ? `${notification.data.nickname}` : '벌통'}
          </span>
          <span className="text-sm text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
        </div>
        <p className="mt-1 text-left font-medium text-gray-700">{notification.data?.message}</p>

        {notification.data && notification.data.status != 'WARNING' && (
          <p className="mt-1 text-left text-sm">
            검사 결과 :{' '}
            <span className={getResultTextColor()}>
              {notification.data.message} || {notification.body}
            </span>
          </p>
        )}
      </div>
    </>
  );
};

export default NotificationItem;

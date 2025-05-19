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
        <p className="mt-1 text-left font-medium text-gray-700">
          {notification.data?.status != 'WARNING' ? '질병 검사를 ' : ''}
          {notification.data?.message}
          {notification.data?.status != 'WARNING' ? '하였습니다.' : ''}
        </p>
      </div>
    </>
  );
};

export default NotificationItem;

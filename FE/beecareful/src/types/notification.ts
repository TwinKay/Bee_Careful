export type NotificationType = {
  id?: string;
  title: string;
  body: string;
  data?: NotificationDataType;
  read?: boolean;
  createdAt: string;
};

export type NotificationDataType = {
  beehiveId: string;
  nickname?: string;
  message: string;
  status: 'WARNING' | 'SUCCESS' | 'DANGER';
};

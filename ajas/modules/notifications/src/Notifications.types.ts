// Notification data received from the listener
export type NotificationData = {
  id: string;
  key: string;
  packageName: string;
  postTime: number;
  title: string;
  text: string;
  subText: string;
  bigText: string;
  category: string;
  isOngoing: boolean;
  isClearable: boolean;
};

// Events emitted by the Notifications module
export type NotificationsModuleEvents = {
  onNotificationPosted: (notification: NotificationData) => void;
  onNotificationRemoved: (notification: NotificationData) => void;
};

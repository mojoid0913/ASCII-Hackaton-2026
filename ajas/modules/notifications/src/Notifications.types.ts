// Analyzed message response from the API
export type AnalyzedData =
  | {
      isSuccessful: true;
      risk_score: number;
      reason: string;
      message: string;
    }
  | {
      isSuccessful: false;
      code: string;
      message: string;
    };

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
  analyzed: AnalyzedData | null;
};

// Events emitted by the Notifications module
export type NotificationsModuleEvents = {
  onNotificationPosted: (notification: NotificationData) => void;
  onNotificationRemoved: (notification: NotificationData) => void;
};

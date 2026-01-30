import { NativeModule, requireNativeModule } from "expo";

import {
  NotificationsModuleEvents,
  NotificationData,
} from "./Notifications.types";

declare class NotificationsModule extends NativeModule<NotificationsModuleEvents> {
  hasNotificationListenerPermission(): boolean;
  openNotificationListenerSettings(): void;
  startListening(): boolean;
  stopListening(): void;
  getActiveNotifications(): Promise<NotificationData[]>;
  dismissNotification(key: string): Promise<void>;
  dismissAllNotifications(): Promise<void>;
  isListening(): boolean;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationsModule>("Notifications");

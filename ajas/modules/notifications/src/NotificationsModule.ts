import { NativeModule, requireNativeModule } from "expo";

import {
  NotificationData,
  NotificationsModuleEvents,
} from "./Notifications.types";

declare class NotificationsModule extends NativeModule<NotificationsModuleEvents> {
  // Check if notification listener permission is granted
  isPermissionGranted(): boolean;

  // Check if listener service is currently connected
  isListenerConnected(): boolean;

  // Open notification listener settings to request permission
  requestPermission(): Promise<void>;

  // Start listening to notifications (register callbacks)
  startListening(): boolean;

  // Stop listening to notifications (unregister callbacks)
  stopListening(): boolean;

  // Get all currently active notifications
  getActiveNotifications(): Promise<NotificationData[]>;

  // Cancel a specific notification by key
  cancelNotification(key: string): Promise<boolean>;

  // Cancel all notifications
  cancelAllNotifications(): Promise<boolean>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationsModule>("Notifications");

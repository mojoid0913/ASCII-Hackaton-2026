import { NativeModule, requireNativeModule } from "expo";

import {
  NotificationData,
  NotificationsModuleEvents,
} from "./Notifications.types";

declare class NotificationsModule extends NativeModule<NotificationsModuleEvents> {
  // Set the API endpoint for message analysis
  setApiEndpoint(endpoint: string): boolean;

  // Get the current API endpoint
  getApiEndpoint(): string;

  // Set target package names to analyze (e.g., ["com.kakao.talk", "com.samsung.android.messaging"])
  setTargetPackageNames(packageNames: string[]): boolean;

  // Get current target package names
  getTargetPackageNames(): string[];

  // Check if a package is in the target list
  isTargetPackage(packageName: string): boolean;

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

  // Fire a test dummy notification with random phone number and test message
  fireDummyNotification(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationsModule>("Notifications");

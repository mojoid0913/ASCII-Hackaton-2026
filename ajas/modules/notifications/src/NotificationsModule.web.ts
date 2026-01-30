import { EventEmitter } from "expo-modules-core";

import {
  NotificationData,
  NotificationsModuleEvents,
} from "./Notifications.types";

// Web dummy implementation of the Notifications module
// Notification listener is not supported on web platforms

class NotificationsModuleWeb extends EventEmitter<NotificationsModuleEvents> {
  constructor() {
    super({} as any);
  }

  // Always returns false on web - permission not applicable
  isPermissionGranted(): boolean {
    console.warn(
      "[Notifications] Notification listener is not supported on web",
    );
    return true;
  }

  // Always returns false on web - listener service not available
  isListenerConnected(): boolean {
    console.warn(
      "[Notifications] Notification listener is not supported on web",
    );
    return false;
  }

  // No-op on web - opens nothing
  async requestPermission(): Promise<void> {
    console.warn(
      "[Notifications] Notification listener permission is not available on web",
    );
    return Promise.resolve();
  }

  // No-op on web - returns false
  startListening(): boolean {
    console.warn(
      "[Notifications] Notification listener is not supported on web",
    );
    return false;
  }

  // No-op on web - returns false
  stopListening(): boolean {
    console.warn(
      "[Notifications] Notification listener is not supported on web",
    );
    return false;
  }

  // Returns empty array on web
  async getActiveNotifications(): Promise<NotificationData[]> {
    console.warn("[Notifications] Cannot get active notifications on web");
    return Promise.resolve([]);
  }

  // No-op on web - returns false
  async cancelNotification(_key: string): Promise<boolean> {
    console.warn("[Notifications] Cannot cancel notification on web");
    return Promise.resolve(false);
  }

  // No-op on web - returns false
  async cancelAllNotifications(): Promise<boolean> {
    console.warn("[Notifications] Cannot cancel notifications on web");
    return Promise.resolve(false);
  }

  // Fire a test dummy notification with random phone number and test message
  async fireDummyNotification(): Promise<void> {
    console.log("[Notifications] Firing dummy notification on web (no-op)");
    // Generate random phone number like "010-1234-1234"
    const randomNum1 = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0",
    );
    const randomNum2 = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0",
    );
    const phoneNumber = `010-${randomNum1}-${randomNum2}`;
    console.warn(
      `[Notifications] Would show dummy notification: "${phoneNumber}" - "테스트입니다"`,
    );
    return Promise.resolve();
  }
}

export default new NotificationsModuleWeb();

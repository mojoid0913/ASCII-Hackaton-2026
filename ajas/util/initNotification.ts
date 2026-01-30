import NotificationsModule from "@/modules/notifications/src/NotificationsModule";

export default async function initNotification() {
  if (NotificationsModule.isPermissionGranted())
    NotificationsModule.isListenerConnected();
  NotificationsModule.requestPermission();
}

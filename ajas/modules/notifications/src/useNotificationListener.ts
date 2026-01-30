import { useEffect, useState, useCallback } from "react";
import NotificationsModule from "./NotificationsModule";
import { NotificationData, ListenerStatusPayload } from "./Notifications.types";

export type UseNotificationListenerOptions = {
  autoStart?: boolean;
  onNotificationPosted?: (notification: NotificationData) => void;
  onNotificationRemoved?: (notification: NotificationData) => void;
};

export type UseNotificationListenerResult = {
  isListening: boolean;
  hasPermission: boolean;
  startListening: () => boolean;
  stopListening: () => void;
  openSettings: () => void;
};

export function useNotificationListener(
  options: UseNotificationListenerOptions = {},
): UseNotificationListenerResult {
  const { onNotificationPosted, onNotificationRemoved } = options;

  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    setHasPermission(NotificationsModule.hasNotificationListenerPermission());
  }, []);

  useEffect(() => {
    const postedSubscription = NotificationsModule.addListener(
      "onNotificationPosted",
      (notification: NotificationData) => {
        onNotificationPosted?.(notification);
      },
    );

    const removedSubscription = NotificationsModule.addListener(
      "onNotificationRemoved",
      (notification: NotificationData) => {
        onNotificationRemoved?.(notification);
      },
    );

    const statusSubscription = NotificationsModule.addListener(
      "onListenerStatusChanged",
      (status: ListenerStatusPayload) => {
        setIsListening(status.isListening);
        setHasPermission(status.hasPermission);
      },
    );

    return () => {
      postedSubscription.remove();
      removedSubscription.remove();
      statusSubscription.remove();
    };
  }, [onNotificationPosted, onNotificationRemoved]);

  const startListening = useCallback(() => {
    const success = NotificationsModule.startListening();
    setIsListening(success);
    return success;
  }, []);

  const stopListening = useCallback(() => {
    NotificationsModule.stopListening();
    setIsListening(false);
  }, []);

  const openSettings = useCallback(() => {
    NotificationsModule.openNotificationListenerSettings();
  }, []);

  return {
    isListening,
    hasPermission,
    startListening,
    stopListening,
    openSettings,
  };
}

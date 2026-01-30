import { useNotificationListener } from "@/modules/notifications";
import React, { useEffect } from "react";
export default function NotificationListener() {
  const { hasPermission, isListening, openSettings, startListening } =
    useNotificationListener({
      onNotificationPosted: (notification) => {
        console.log("Notification posted:", notification);
      },
      onNotificationRemoved: (notification) => {
        console.log("Notification removed:", notification);
      },
    });

  useEffect(() => {
    if (!hasPermission && !isListening) {
      openSettings();
      return;
    }

    if (hasPermission && !isListening) {
      const started = startListening();
      console.log("Started listening:", started);
    }
  }, [hasPermission, isListening, startListening]);

  return null;
}

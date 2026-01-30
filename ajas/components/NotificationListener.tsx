import NotificationsModule from "@/modules/notifications/src/NotificationsModule";
import { useEffect, useState } from "react";

export default function NotificationListener() {
  const [hasPermission, setHasPermission] = useState(false);

  // 권한 요청 effect
  useEffect(() => {
    console.log("[NotificationListener] Checking permission status...");
    const permissionGranted = NotificationsModule.isPermissionGranted();
    console.log(
      "[NotificationListener] Permission granted:",
      permissionGranted,
    );

    if (permissionGranted) {
      setHasPermission(true);
    } else {
      console.log("[NotificationListener] Requesting permission...");
      NotificationsModule.requestPermission().then(() => {
        console.log(
          "[NotificationListener] Permission request completed, rechecking...",
        );
        // 설정 화면에서 돌아온 후 권한 재확인
        const newPermissionStatus = NotificationsModule.isPermissionGranted();
        console.log(
          "[NotificationListener] New permission status:",
          newPermissionStatus,
        );
        setHasPermission(newPermissionStatus);
      });
    }
  }, []);

  // 리스너 등록 effect (권한이 있을 때만)
  useEffect(() => {
    if (!hasPermission) {
      console.log(
        "[NotificationListener] No permission, skipping listener registration",
      );
      return;
    }

    console.log("[NotificationListener] Registering notification listener...");

    // 이벤트 리스너 등록
    const subscription = NotificationsModule.addListener(
      "onNotificationPosted",
      (notification) => {
        console.log("[NotificationListener] New notification received:");
        console.log("  - Package:", notification.packageName);
        console.log("  - Title:", notification.title);
        console.log("  - Text:", notification.text);
      },
    );

    // 리스너 시작
    console.log("[NotificationListener] Starting listener...");
    const started = NotificationsModule.startListening();
    console.log("[NotificationListener] Listener started:", started);

    return () => {
      console.log("[NotificationListener] Cleaning up listener...");
      NotificationsModule.stopListening();
      subscription.remove();
      console.log("[NotificationListener] Listener cleanup complete");
    };
  }, [hasPermission]);

  return null;
}

import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import NotificationsModule from "@/modules/notifications/src/NotificationsModule";

export function useNotificationPermissions() {
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log(
          "[useNotificationPermissions] Checking permission status...",
        );
        let permissionGranted = NotificationsModule.isPermissionGranted();

        if (!permissionGranted) {
          console.log("[useNotificationPermissions] Requesting permission...");
          await NotificationsModule.requestPermission();

          // 권한 상태 다시 확인
          permissionGranted = NotificationsModule.isPermissionGranted();
          console.log(
            "[useNotificationPermissions] Permission status after request:",
            permissionGranted,
          );
        }

        if (!permissionGranted) {
          console.error(
            "[useNotificationPermissions] Permission denied - app will exit",
          );
          // 권한이 없으면 앱 종료
          process.exit(1);
        }

        setHasPermission(true);

        // 리스너 시작
        console.log(
          "[useNotificationPermissions] Starting notification listener...",
        );
        const started = NotificationsModule.startListening();
        console.log("[useNotificationPermissions] Listener started:", started);

        // 이벤트 리스너 등록
        const subscription = NotificationsModule.addListener(
          "onNotificationPosted",
          (notification) => {
            console.log("[useNotificationPermissions] Notification received:");
            console.log("  - Package:", notification.packageName);
            console.log("  - Title:", notification.title);
            console.log("  - Text:", notification.text);
          },
        );

        console.log(
          "[useNotificationPermissions] Setup complete, hiding splash screen",
        );
        // Splash 화면 숨김
        await SplashScreen.hideAsync();
        setIsReady(true);

        return () => {
          console.log("[useNotificationPermissions] Cleaning up...");
          NotificationsModule.stopListening();
          subscription.remove();
        };
      } catch (error) {
        console.error("[useNotificationPermissions] Error:", error);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignore errors hiding splash
        }
        process.exit(1);
      }
    })();
  }, []);

  return { isReady, hasPermission };
}

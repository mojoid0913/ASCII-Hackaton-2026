import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useExpoNotificationPermissions() {
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log("[useExpoNotificationPermissions] Checking permission...");

        // Android 채널 설정
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        // 권한 확인
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          console.log(
            "[useExpoNotificationPermissions] Requesting permission...",
          );
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.error(
            "[useExpoNotificationPermissions] Permission denied - app will exit",
          );
          // 권한이 없으면 앱 종료
          process.exit(1);
        }

        setHasPermission(true);
        console.log("[useExpoNotificationPermissions] Permission granted");

        setIsReady(true);
      } catch (error) {
        console.error("[useExpoNotificationPermissions] Error:", error);
        process.exit(1);
      }
    })();
  }, []);

  return { isReady, hasPermission };
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // 즉시 발송
  });
}

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

/**
 * Expo 알림 권한 초기화
 * @throws 권한이 거부된 경우 에러 발생
 */
export async function initExpoNotifications(): Promise<void> {
  console.log("[initExpoNotifications] Checking permission...");

  if (Platform.OS === "web") {
    console.log("[initExpoNotifications] Web platform - skipping");
    return;
  }

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
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    console.log("[initExpoNotifications] Requesting permission...");
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Expo notification permission denied");
  }

  console.log("[initExpoNotifications] Permission granted");
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> {
  if (Platform.OS === "web") {
    alert(`${title}\n${body}`);
    return "mock-notification";
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // 즉시 발송
  });
}

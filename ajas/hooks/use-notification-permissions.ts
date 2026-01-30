import NotificationsModule from "@/modules/notifications/src/NotificationsModule";
import { TARGET_PACKAGE_NAMES } from "@/constants/targetPackage";
import { showLocalNotification } from "./use-expo-notifications";
import { AlertLevel, judgeAlertLevel } from "@/util/alertLevel";
import { saveAnalyzeHistory } from "@/util/analyzeHistoryStorage";
import { ENV } from "@/constants/env";

/**
 * 네이티브 알림 리스너 초기화
 * @returns cleanup 함수
 * @throws 권한이 거부된 경우 에러 발생
 */
export async function initNotificationListener(): Promise<void> {
  console.log("[initNotificationListener] Checking permission status...");
  let permissionGranted = NotificationsModule.isPermissionGranted();

  if (!permissionGranted) {
    console.log("[initNotificationListener] Requesting permission...");
    await NotificationsModule.requestPermission();

    // 권한이 부여될 때까지 polling (최대 10초, 200ms 간격)
    const maxWaitMs = 10000;
    const intervalMs = 200;
    let waited = 0;
    while (waited < maxWaitMs) {
      permissionGranted = NotificationsModule.isPermissionGranted();
      if (permissionGranted) break;
      await new Promise((res) => setTimeout(res, intervalMs));
      waited += intervalMs;
    }
    console.log(
      "[initNotificationListener] Permission status after request:",
      permissionGranted,
    );
  }

  if (!permissionGranted) {
    throw new Error("Notification listener permission denied");
  }

  // // 이미 리스너가 연결되어 있으면 중복 실행 방지
  // if (
  //   typeof NotificationsModule.isListenerConnected === "function" &&
  //   NotificationsModule.isListenerConnected()
  // ) {
  //   console.log(
  //     "[initNotificationListener] Listener already connected, skipping setup.",
  //   );
  //   return;
  // }

  // 리스너 시작
  console.log("[initNotificationListener] Starting notification listener...");

  // Native 모듈에 API 엔드포인트와 타겟 패키지 설정
  NotificationsModule.setApiEndpoint(ENV.API_ENDPOINT);
  NotificationsModule.setTargetPackageNames(TARGET_PACKAGE_NAMES);

  const started = NotificationsModule.startListening();
  console.log("[initNotificationListener] Listener started:", started);

  // 이벤트 리스너 등록
  NotificationsModule.addListener("onNotificationPosted", (notification) => {
    if (!TARGET_PACKAGE_NAMES.includes(notification.packageName)) {
      return;
    }

    // 카카오톡의 경우 key의 4번째 자리가 null이면 무시
    if (notification.packageName === "com.kakao.talk") {
      const keyParts = notification.key?.split("|");
      if (keyParts && keyParts[3] === "null") {
        return;
      }
    }

    // Native에서 분석된 결과 사용
    const analyzed = notification.analyzed;
    if (!analyzed) {
      console.log("[Notification Analysis] No analysis data available");
      return;
    }

    if (!analyzed.isSuccessful) {
      console.error(
        "[Notification Analysis] Failed to analyze message:",
        analyzed.message,
      );
      return;
    }

    const alertLevel = judgeAlertLevel(analyzed.risk_score);
    saveAnalyzeHistory({
      sender: notification.title,
      content: notification.text,
      riskScore: analyzed.risk_score,
      reason: analyzed.reason,
      packageName: notification.packageName,
      alertLevel: alertLevel,
      dismissed: false,
    }).catch((error) => {
      console.error("[Notification Analysis] Failed to save history:", error);
    });

    if (alertLevel !== AlertLevel.SAFE) {
      showLocalNotification("⚠️의심 문자입니다", "");
    }
  });

  console.log("[initNotificationListener] Setup complete");
}

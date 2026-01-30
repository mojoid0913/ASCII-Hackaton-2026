import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import NotificationsModule from "@/modules/notifications/src/NotificationsModule";
import { TARGET_PACKAGE_NAMES } from "@/constants/targetPackage";
import { showLocalNotification } from "./use-expo-notifications";
import { AlertLevel, judgeAlertLevel } from "@/util/alertLevel";
import { saveAnalyzeHistory } from "@/util/analyzeHistoryStorage";
import { ENV } from "@/constants/env";

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
          BackHandler.exitApp();
          return;
        }

        setHasPermission(true);

        // 리스너 시작
        console.log(
          "[useNotificationPermissions] Starting notification listener...",
        );

        // Native 모듈에 API 엔드포인트와 타겟 패키지 설정
        NotificationsModule.setApiEndpoint(ENV.API_ENDPOINT);
        NotificationsModule.setTargetPackageNames(TARGET_PACKAGE_NAMES);

        const started = NotificationsModule.startListening();
        console.log("[useNotificationPermissions] Listener started:", started);

        // 이벤트 리스너 등록
        const subscription = NotificationsModule.addListener(
          "onNotificationPosted",
          (notification) => {
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
              console.error(
                "[Notification Analysis] Failed to save history:",
                error,
              );
            });

            if (alertLevel !== AlertLevel.SAFE) {
              showLocalNotification("⚠️의심 문자입니다", "");
            }
          },
        );

        console.log("[useNotificationPermissions] Setup complete");
        setIsReady(true);

        return () => {
          console.log("[useNotificationPermissions] Cleaning up...");
          NotificationsModule.stopListening();
          subscription.remove();
        };
      } catch (error) {
        console.error("[useNotificationPermissions] Error:", error);
        BackHandler.exitApp();
      }
    })();
  }, []);

  return { isReady, hasPermission };
}

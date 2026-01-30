import { useEffect, useState } from "react";
import NotificationsModule from "@/modules/notifications/src/NotificationsModule";
import analyzeMessage from "@/api/analyzeMessage";
import { TARGET_PACKAGE_NAMES } from "@/constants/targetPackage";
import { showLocalNotification } from "./use-expo-notifications";
import { AlertLevel, judgeAlertLevel } from "@/util/alertLevel";
import { saveAnalyzeHistory } from "@/util/analyzeHistoryStorage";

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

            analyzeMessage({
              sender: notification.title,
              content: notification.text,
            })
              .then((response) => {
                console.log("[Notification Analysis] Response:", response);
                if (!response.isSuccessful) {
                  console.error(
                    "[Notification Analysis] Failed to analyze message:",
                    response.message,
                  );
                  return;
                }
                const alertLevel = judgeAlertLevel(response.risk_score);
                saveAnalyzeHistory({
                  sender: notification.title,
                  content: notification.text,
                  riskScore: response.risk_score,
                  reason: response.reason,
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
              })
              .catch((error) => {
                console.error("[Notification Analysis] Error:", error);
              });
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
        process.exit(1);
      }
    })();
  }, []);

  return { isReady, hasPermission };
}

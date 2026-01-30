import { StyleSheet, Image, View, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as SMS from "expo-sms";
import { getSettings } from "@/util/Storage";
import { useMemo, useCallback, useState } from "react";
import { Surface, FAB } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import {
  AnalyzeHistoryItem,
  listAnalyzeHistory,
} from "@/util/analyzeHistoryStorage";
import { dismissAnalyzeHistory } from "@/util/dismissAnalyzeHistory";
import { AlertLevel } from "@/util/alertLevel";
import { TARGET_PACKAGE_NAMES_HUMAN_READABLE } from "@/constants/targetPackage";
import { useFocusEffect, useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        if (!s?.onboardingCompleted) {
          return router.replace("/settings");
        }

        if (s?.fontSize) setFontSize(s.fontSize);
      });
    }, []),
  );
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analyzeHistory"],
    queryFn: listAnalyzeHistory,
  });

  const latestAlert = useMemo(() => {
    if (!data) return null;

    return (
      data.find(
        (item) => !item.dismissed && item.alertLevel !== AlertLevel.SAFE,
      ) || null
    );
  }, [data]);

  if (!latestAlert) {
    return (
      <ThemedView
        style={[styles.centerContent, { flex: 1, marginTop: -fontSize * 4 }]}
      >
        <View style={styles.centerContent}>
          <Image
            source={require("@/assets/images/icon.png")}
            height={450}
            width={450}
            style={styles.icon}
            resizeMode="contain"
          />
          <ThemedText
            style={[
              styles.mainText,
              {
                fontSize: fontSize * 1.2,
                lineHeight: fontSize * 1.8,
                textAlign: "center",
              },
            ]}
          >
            지금 보호 중입니다
          </ThemedText>
          <ThemedText
            style={[
              styles.subText,
              {
                fontSize: fontSize * 0.9,
                lineHeight: fontSize,
                textAlign: "center",
              },
            ]}
          >
            스미싱을 실시간으로 예방하고 있어요
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const getAlertInfo = (level: AlertLevel) => {
    switch (level) {
      case AlertLevel.SAFE:
        return {
          text: "안전해요",
          icon: "checkmark-circle" as const,
          color: "#A0E398",
        };
      case AlertLevel.MEDIUM:
        return {
          text: "주의가 필요해요",
          icon: "warning" as const,
          color: "#FFB84D",
        };
      case AlertLevel.HIGH:
        return {
          text: "위험해요",
          icon: "alert-circle" as const,
          color: "#FF6B6B",
        };
    }
  };

  const alertInfo = getAlertInfo(latestAlert.alertLevel);
  const appName =
    TARGET_PACKAGE_NAMES_HUMAN_READABLE[
      latestAlert.packageName as keyof typeof TARGET_PACKAGE_NAMES_HUMAN_READABLE
    ] || latestAlert.packageName;
  const truncatedContent =
    latestAlert.content.length > 500
      ? latestAlert.content.slice(0, 500) + "..."
      : latestAlert.content;

  const handleDismiss = async () => {
    try {
      await dismissAnalyzeHistory(latestAlert.id);
      queryClient.invalidateQueries({ queryKey: ["analyzeHistory"] });
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    }
  };

  const handleRequestChildConfirmation = async () => {
    try {
      const settings = await getSettings();
      const phoneNumbers = settings?.guardians?.map((g) => g.phoneNumber) || [];
      if (phoneNumbers.length === 0) {
        alert("등록된 보호자가 없습니다. 설정에서 보호자를 먼저 등록해주세요.");
        return;
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const message = `[안심알림] 보호자분, 확인 부탁드립니다.\n방금 모르는 번호(${latestAlert.sender})로부터 의심스러운 문자가 와서 앱이 탐지했습니다.\n\n내용: ${latestAlert.content}\n분석: ${latestAlert.reason}`;

        await SMS.sendSMSAsync(phoneNumbers, message);
        dismissAnalyzeHistory(latestAlert.id);
        queryClient.invalidateQueries({ queryKey: ["analyzeHistory"] });
      } else {
        alert("이 기기에서는 문자 메시지 기능을 사용할 수 없습니다.");
      }
    } catch (error) {
      console.error("문자 전송 중 오류:", error);
      alert("보호자 정보를 불러오거나 문자를 보내는 데 실패했습니다.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        // 1. 하단 여백: 버튼에 가려지지 않게 끝까지 스크롤 허용
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: fontSize * 5 },
        ]}
      >
        <View style={styles.alertHeader}>
          <Ionicons
            name={alertInfo.icon}
            size={fontSize * 3}
            color={alertInfo.color}
          />
          <ThemedText
            type="title"
            // 2. 제목: lineHeight를 fontSize의 약 1.3배 이상 주어 겹침 방지
            style={[
              styles.alertText,
              {
                color: alertInfo.color,
                fontSize: fontSize * 1.5,
                lineHeight: fontSize * 2,
              },
            ]}
          >
            {alertInfo.text}
          </ThemedText>
        </View>

        {/* 3. Surface: height: 'auto'를 넣어 글자 크기에 따라 상자가 늘어나게 함 */}
        <Surface style={[styles.surface, { height: "auto" }]} elevation={2}>
          <ThemedText
            type="subtitle"
            style={[
              styles.sectionTitle,
              { fontSize: fontSize, lineHeight: fontSize * 1.4 },
            ]}
          >
            수신된 {appName} 내용
          </ThemedText>
          <View style={styles.messageInfo}>
            <ThemedText
              type="defaultSemiBold"
              style={[styles.sender, { fontSize: fontSize * 0.8 }]}
            >
              {latestAlert.sender}
            </ThemedText>
            {/* 본문 줄간격 확보 */}
            <ThemedText
              style={[
                styles.content,
                { fontSize: fontSize * 0.9, lineHeight: fontSize * 1.5 },
              ]}
            >
              {truncatedContent}
            </ThemedText>
          </View>
        </Surface>

        <Surface style={[styles.surface, { height: "auto" }]} elevation={2}>
          <ThemedText
            type="subtitle"
            style={[
              styles.sectionTitle,
              { fontSize: fontSize, lineHeight: fontSize * 1.4 },
            ]}
          >
            분석 결과
          </ThemedText>
          <ThemedText
            style={[
              styles.reason,
              { fontSize: fontSize * 0.9, lineHeight: fontSize * 1.5 },
            ]}
          >
            {latestAlert.reason}
          </ThemedText>
        </Surface>
      </ScrollView>

      <View style={styles.fabContainer}>
        <FAB
          icon="account-child"
          label="자녀에게 확인요청"
          onPress={handleRequestChildConfirmation}
          style={styles.fabLeft}
          mode="elevated"
          color="#fff"
        />
        <FAB
          icon="close"
          label="무시하기"
          onPress={handleDismiss}
          style={styles.fabRight}
          mode="elevated"
          color="#666"
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  mainText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subText: {
    fontSize: 14,
    color: "#666",
    opacity: 0.7,
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingVertical: 20,
  },
  alertHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  alertText: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },
  surface: {
    padding: 16,
    borderRadius: 12,
    margin: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  messageInfo: {
    gap: 8,
  },
  sender: {
    fontSize: 16,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
  },
  fabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  fabLeft: {
    flex: 1,
    backgroundColor: "#5DB075",
  },
  fabRight: {
    flex: 1,
    backgroundColor: "#e8f5e6",
  },
});

import { StyleSheet, Image, View, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
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

export default function HomeScreen() {
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
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.mainText}>
            지금 보호 중입니다
          </ThemedText>
          <ThemedText style={styles.subText}>
            문자 메세지를 실시간으로 감시하고 있어요
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
          color: "#4CAF50",
        };
      case AlertLevel.MEDIUM:
        return {
          text: "주의가 필요해요",
          icon: "warning" as const,
          color: "#FF9800",
        };
      case AlertLevel.HIGH:
        return {
          text: "위험해요",
          icon: "alert-circle" as const,
          color: "#F44336",
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

  const handleRequestChildConfirmation = () => {
    // TODO: Implement child confirmation request
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.alertHeader}>
          <Ionicons name={alertInfo.icon} size={64} color={alertInfo.color} />
          <ThemedText
            type="title"
            style={[styles.alertText, { color: alertInfo.color }]}
          >
            {alertInfo.text}
          </ThemedText>
        </View>

        <Surface style={styles.surface} elevation={2}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            수신된 {appName} 내용
          </ThemedText>
          <View style={styles.messageInfo}>
            <ThemedText type="defaultSemiBold" style={styles.sender}>
              {latestAlert.sender}
            </ThemedText>
            <ThemedText style={styles.content}>{truncatedContent}</ThemedText>
          </View>
        </Surface>

        <Surface style={styles.surface} elevation={2}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            분석 결과
          </ThemedText>
          <ThemedText style={styles.reason}>{latestAlert.reason}</ThemedText>
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
    width: 120,
    height: 120,
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
    backgroundColor: "#6200EE",
  },
  fabRight: {
    flex: 1,
    backgroundColor: "#E0E0E0",
  },
});

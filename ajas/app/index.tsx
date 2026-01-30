import { StyleSheet, Image, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { listAnalyzeHistory } from "@/util/analyzeHistoryStorage";

export default function HomeScreen() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analyzeHistory"],
    queryFn: listAnalyzeHistory,
  });

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
});

import { StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Button } from "react-native-paper";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">홈페이지</ThemedText>
      <ThemedText style={styles.description}>
        홈페이지 플레이스홀더입니다.
      </ThemedText>

      <Link href="/settings" asChild>
        <Button mode="contained" style={styles.button}>
          설정으로 이동
        </Button>
      </Link>
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
  description: {
    marginTop: 10,
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    marginTop: 20,
  },
});

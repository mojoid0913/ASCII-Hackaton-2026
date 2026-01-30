import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const TOTAL_STEPS = 3;

export default function SettingsScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.back();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <ThemedText type="title">설정 1단계</ThemedText>
            <ThemedText style={styles.description}>
              첫 번째 설정 단계 플레이스홀더입니다.
            </ThemedText>
          </>
        );
      case 1:
        return (
          <>
            <ThemedText type="title">설정 2단계</ThemedText>
            <ThemedText style={styles.description}>
              두 번째 설정 단계 플레이스홀더입니다.
            </ThemedText>
          </>
        );
      case 2:
        return (
          <>
            <ThemedText type="title">설정 3단계</ThemedText>
            <ThemedText style={styles.description}>
              세 번째 설정 단계 플레이스홀더입니다.
            </ThemedText>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>{renderStepContent()}</View>

      {/* 페이지 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentStep && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* 다음으로 버튼 */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleNext} style={styles.button}>
          {currentStep < TOTAL_STEPS - 1 ? "다음으로" : "완료"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    marginTop: 10,
    opacity: 0.7,
    textAlign: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  indicatorActive: {
    backgroundColor: "#6200ee",
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  button: {
    paddingVertical: 5,
  },
});

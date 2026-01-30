import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";

type AjasNavigationBarProps = NativeStackHeaderProps & {
  showBackButton: boolean;
  showSettingsButton: boolean;
};

export default function AjasNavigationBar({
  navigation,
  showBackButton,
  showSettingsButton,
}: AjasNavigationBarProps) {
  return (
    <Appbar.Header>
      {showBackButton && <Appbar.BackAction onPress={navigation.goBack} />}
      <Appbar.Content title={""} />
      {showSettingsButton && (
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate("settings")}
        />
      )}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  centerContent: {
    alignItems: "center",
  },
});

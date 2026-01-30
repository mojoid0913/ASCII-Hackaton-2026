import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from "react-native-paper";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationPermissions } from "@/hooks/use-notification-permissions";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady } = useNotificationPermissions();

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PaperProvider
        theme={colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{ presentation: "modal", title: "설정" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </ThemeProvider>
  );
}

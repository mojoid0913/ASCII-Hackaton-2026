import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from "react-native-paper";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initExpoNotifications } from "@/hooks/use-expo-notifications";
import { initNotificationListener } from "@/hooks/use-notification-permissions";
import { initializeAnalyzeHistoryStorage } from "@/util/analyzeHistoryStorage";
import AjasNavigationBar from "@/components/AjasNavigationBar";
import { queryClient } from "@/global/queryClient";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (isReady) return;
      try {
        console.log("[RootLayout] Starting initialization...");

        await initExpoNotifications();
        console.log("[RootLayout] Expo notifications initialized");

        await initNotificationListener();
        console.log("[RootLayout] Notification listener initialized");

        await initializeAnalyzeHistoryStorage();
        console.log("[RootLayout] Analyze history storage initialized");

        setIsReady(true);
        SplashScreen.hideAsync();
      } catch (error) {
        console.error("[RootLayout] Initialization failed:", error);
        BackHandler.exitApp();
      }
    })();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <PaperProvider
          theme={colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme}
        >
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                header: (props) => (
                  <AjasNavigationBar
                    {...props}
                    showBackButton={false}
                    showSettingsButton={true}
                  />
                ),
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: "modal",
                title: "설정",
                header: (props) => (
                  <AjasNavigationBar
                    {...props}
                    showBackButton={true}
                    showSettingsButton={false}
                  />
                ),
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </PaperProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationPermissions } from "@/hooks/use-notification-permissions";
import { useExpoNotificationPermissions } from "@/hooks/use-expo-notifications";
import { initializeAnalyzeHistoryStorage } from "@/util/analyzeHistoryStorage";
import AjasNavigationBar from "@/components/AjasNavigationBar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady: notificationReady } = useNotificationPermissions();
  const { isReady: expoNotificationReady } = useExpoNotificationPermissions();
  const [historyReady, setHistoryReady] = useState(false);

  const allReady = notificationReady && expoNotificationReady && historyReady;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await initializeAnalyzeHistoryStorage();
      } catch (error) {
        console.error("[RootLayout] History init failed:", error);
      } finally {
        if (isMounted) {
          setHistoryReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (allReady) {
      console.log("[RootLayout] All permissions ready, hiding splash screen");
      SplashScreen.hideAsync();
    }
  }, [allReady]);

  if (!allReady) {
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

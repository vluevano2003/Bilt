import { useNetInfo } from "@react-native-community/netinfo";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";

import { useRootNavigationState } from "expo-router";
import { MiniWorkoutPlayer } from "../src/components/MiniWorkoutPlayer";
import "../src/config/i18n";
import { ActiveWorkoutProvider } from "../src/context/ActiveWorkoutContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isForeground = AppState.currentState === "active";
    const isTimerAlert = notification.request.identifier === "rest_timer_alert";

    if (isTimerAlert && isForeground) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

function RootLayoutNav() {
  const { user, isLoading, hasProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const rootNavigationState = useRootNavigationState();

  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const [offlineAlertShown, setOfflineAlertShown] = useState(false);

  const url = Linking.useURL();
  const [initialDeepLinkHandled, setInitialDeepLinkHandled] = useState(false);

  useEffect(() => {
    if (netInfo.isConnected === false && !offlineAlertShown) {
      Alert.alert(
        t("alerts.error", "Error"),
        t(
          "errors.networkFailed",
          "Parece que no hay conexión a internet. Revisa tu red e inténtalo de nuevo.",
        ),
      );
      setOfflineAlertShown(true);
    }
  }, [netInfo.isConnected, offlineAlertShown, t]);

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const firstSegment = segments[0] as string | undefined;

    const inTabsGroup = firstSegment === "(tabs)";
    const inUserProfile = firstSegment === "userProfile";
    const inActiveWorkout = firstSegment === "activeWorkout";

    const isProtectedScreen = inTabsGroup || inUserProfile || inActiveWorkout;

    const inIndex = !firstSegment || firstSegment === "index";

    // Caso: no hay sesión
    if (!user) {
      if (isProtectedScreen) {
        router.replace("/");
      }
      return;
    }

    // Caso: hay sesión pero no hay perfil
    if (user && !hasProfile) {
      if (isProtectedScreen) {
        router.replace("/");
      }
      return;
    }

    // Caso: el usuario está logueado y tiene perfil
    if (user && hasProfile) {
      if (url && !initialDeepLinkHandled) {
        setInitialDeepLinkHandled(true);
        return;
      }

      if (inIndex) {
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 10);
      }
    }
  }, [
    user,
    isLoading,
    hasProfile,
    segments,
    url,
    initialDeepLinkHandled,
    rootNavigationState?.key,
  ]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="userProfile" options={{ presentation: "card" }} />
      <Stack.Screen
        name="activeWorkout"
        options={{ presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        debugLog("¡AdMob Inicializado correctamente!");
      })
      .catch((error) => {
        debugError("Error inicializando AdMob:", error);
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ActiveWorkoutProvider>
            <RootLayoutNav />
            <MiniWorkoutPlayer />
          </ActiveWorkoutProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

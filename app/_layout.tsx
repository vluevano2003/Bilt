import { Feather } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";

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
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const { user, isLoading, hasProfile, isError, retryInit } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const rootNavigationState = useRootNavigationState();

  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const [offlineAlertShown, setOfflineAlertShown] = useState(false);

  const url = Linking.useURL();
  const [hasHandledInitialLink, setHasHandledInitialLink] = useState(false);

  const firstSegment = segments[0] as string | undefined;
  const inIndex = !firstSegment || firstSegment === "index";

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
    if (isLoading || !rootNavigationState?.key || isError) return;

    const inTabsGroup = firstSegment === "(tabs)";
    const inUserProfile = firstSegment === "userProfile";
    const inActiveWorkout = firstSegment === "activeWorkout";
    const isProtectedScreen = inTabsGroup || inUserProfile || inActiveWorkout;

    const hideSplash = () => {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(debugError);
      }, 50);
    };

    if (!user && isProtectedScreen) {
      router.replace("/");
      hideSplash();
    } else if (user && !hasProfile && isProtectedScreen) {
      router.replace("/");
      hideSplash();
    } else if (user && hasProfile && inIndex) {
      if (url && !hasHandledInitialLink) {
        setHasHandledInitialLink(true);
        hideSplash();
        return;
      }
      router.replace("/(tabs)/home");
      hideSplash();
    } else {
      hideSplash();
    }
  }, [
    user,
    isLoading,
    hasProfile,
    segments,
    url,
    hasHandledInitialLink,
    rootNavigationState?.key,
    isError,
  ]);

  if (isError) {
    SplashScreen.hideAsync().catch(debugError);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Feather
          name="wifi-off"
          size={60}
          color={colors.textSecondary}
          style={{ marginBottom: 20 }}
        />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {t("errors.connectionTitle", "Problema de conexión")}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          {t(
            "errors.connectionMsg",
            "No pudimos cargar tu sesión. Revisa tu internet e inténtalo de nuevo.",
          )}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 25,
          }}
          onPress={retryInit}
        >
          <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>
            {t("common.retry", "Reintentar")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="index" />
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

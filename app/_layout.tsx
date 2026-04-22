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

import { usePushNotifications } from "../hooks/usePushNotifications";
import { MiniWorkoutPlayer } from "../src/components/MiniWorkoutPlayer";
import "../src/config/i18n";
import { ActiveWorkoutProvider } from "../src/context/ActiveWorkoutContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../src/utils/Responsive";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Manejador de notificaciones para controlar el comportamiento de las alertas.
 * Si la notificación es una alerta de temporizador de descanso y la app está en primer plano,
 * no se muestra la alerta ni se reproduce el sonido.
 * Para otras notificaciones, se muestran normalmente.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isTimerAlert = notification.request.identifier === "rest_timer_alert";
    const isForeground = AppState.currentState === "active";

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

/**
 * Componente de navegación raíz que controla la lógica de autenticación, manejo de enlaces profundos,
 * y estado de la conexión a internet. Muestra diferentes pantallas según el estado del usuario y la red.
 * @returns
 */
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

  usePushNotifications(user?.id);

  const firstSegment = segments[0] as string | undefined;
  const inIndex = !firstSegment || firstSegment === "index";

  // Alertar al usuario si no hay conexión a internet al iniciar la app
  useEffect(() => {
    if (netInfo.isConnected === false && !offlineAlertShown) {
      Alert.alert(t("alerts.error"), t("errors.networkFailed"));
      setOfflineAlertShown(true);
    }
  }, [netInfo.isConnected, offlineAlertShown, t]);

  // Controlar la navegación según el estado de autenticación, perfil del usuario, y la pantalla actual.
  useEffect(() => {
    if (isLoading || !rootNavigationState?.key || isError) return;

    const inTabsGroup = firstSegment === "(tabs)";
    const inUserProfile = firstSegment === "userProfile";
    const inActiveWorkout = firstSegment === "activeWorkout";
    const isProtectedScreen = inTabsGroup || inUserProfile || inActiveWorkout;

    /**
     * Función para ocultar la pantalla de carga después de un breve retraso, asegurando una transición suave.
     */
    const hideSplash = () => {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(debugError);
      }, 50);
    };

    // Lógica de navegación basada en el estado del usuario y la pantalla actual
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

  // Si hay un error de conexión, mostrar una pantalla de error con opción para reintentar
  if (isError) {
    SplashScreen.hideAsync().catch(debugError);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: scale(20),
        }}
      >
        <Feather
          name="wifi-off"
          size={moderateScale(60)}
          color={colors.textSecondary}
          style={{ marginBottom: verticalScale(20) }}
        />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: moderateScale(18),
            fontWeight: "bold",
            marginBottom: verticalScale(10),
            textAlign: "center",
          }}
        >
          {t("errors.connectionTitle")}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: moderateScale(14),
            marginBottom: verticalScale(30),
            textAlign: "center",
          }}
        >
          {t("errors.connectionMsg")}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: verticalScale(12),
            paddingHorizontal: scale(30),
            borderRadius: moderateScale(25),
          }}
          onPress={retryInit}
        >
          <Text
            style={{
              color: "#FFF",
              fontWeight: "bold",
              fontSize: moderateScale(16),
            }}
          >
            {t("common.retry")}
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

/**
 * Componente raíz de la aplicación que envuelve toda la navegación y lógica de estado global.
 * Inicializa AdMob al montar el componente y maneja la configuración de notificaciones.
 * @returns
 */
export default function RootLayout() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        debugLog("AdMob Inicializado correctamente!");
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

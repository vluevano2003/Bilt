import Constants from "expo-constants";
import * as Device from "expo-device";
import { getLocales } from "expo-localization";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "../src/config/supabase";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

const debugWarn = (...args: any[]) => {
  if (__DEV__) console.warn(...args);
};

/**
 * Hook personalizado para gestionar notificaciones push con Expo y Supabase
 * @param userId
 * @returns
 */
export function usePushNotifications(userId: string | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Registrar y manejar notificaciones push
  useEffect(() => {
    if (!userId) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToSupabase(userId, token);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        debugLog("Notificación recibida en primer plano:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        debugLog("Usuario tocó la notificación:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  /**
   * Función para guardar el token de notificaciones y el idioma en Supabase
   * @param uid
   * @param token
   */
  const saveTokenToSupabase = async (uid: string, token: string) => {
    try {
      const currentLocale = getLocales()[0]?.languageCode ?? "es";

      const { error } = await supabase
        .from("users")
        .update({
          push_token: token,
          locale: currentLocale,
        })
        .eq("id", uid);

      if (error) {
        debugError("ERROR DE SUPABASE AL GUARDAR TOKEN/LOCALE:", error.message);
      } else {
        debugLog("Token e idioma guardados en Supabase con éxito!");
      }
    } catch (error) {
      debugError("ERROR DESCONOCIDO AL GUARDAR:", error);
    }
  };

  /**
   * Función para registrar el dispositivo para notificaciones push y obtener el token
   * @returns
   */
  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "General",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ea580c",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        debugLog("El usuario denegó los permisos de notificaciones.");
        return;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          debugWarn("No se encontró projectId.");
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;

        debugLog("Token generado:", token);
      } catch (e: any) {
        debugError("ERROR AL PEDIR TOKEN A EXPO:", e);
      }
    } else {
      debugLog("Estás en un emulador. Usa un celular físico.");
    }

    return token;
  }

  return { expoPushToken };
}

import Constants from "expo-constants";
import * as Device from "expo-device";
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

  useEffect(() => {
    if (!userId) {
      debugLog("No hay userId, esperando a que inicie sesión...");
      return;
    }

    debugLog("Iniciando registro de notificaciones para el usuario:", userId);

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        debugLog("¡Token generado exitosamente! ->", token);
        setExpoPushToken(token);
        saveTokenToSupabase(userId, token);
      } else {
        debugLog("No se pudo generar el token de Expo.");
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

  const saveTokenToSupabase = async (uid: string, token: string) => {
    debugLog("Intentando guardar token en Supabase...");
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ push_token: token })
        .eq("id", uid);

      if (error) {
        debugError("❌ ERROR DE SUPABASE AL GUARDAR TOKEN:", error.message);
      } else {
        debugLog("✅ ¡Token guardado en Supabase con éxito!");
      }
    } catch (error) {
      debugError("❌ ERROR DESCONOCIDO AL GUARDAR:", error);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        debugLog("Pidiendo permisos al usuario...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        debugLog("❌ El usuario denegó los permisos de notificaciones.");
        return;
      }

      try {
        debugLog(
          "Permisos concedidos, solicitando token a los servidores de Expo...",
        );
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          debugWarn(
            "⚠️ Advertencia: No se encontró projectId. Si da error, necesitas ponerlo manual.",
          );
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;
      } catch (e: any) {
        debugError("❌ ERROR AL PEDIR TOKEN A EXPO:", e);
      }
    } else {
      debugLog("❌ Estás en un emulador. Usa un celular físico.");
    }

    return token;
  }

  return { expoPushToken };
}

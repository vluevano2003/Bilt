import { AntDesign } from "@expo/vector-icons";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/supabase";
import { useTheme } from "../context/ThemeContext";

interface GoogleSignInButtonProps {
  onRegisterRequired?: (userData: {
    email: string;
    name: string;
    photo: string;
  }) => void;
}

/**
 * Componente de botón para iniciar sesión con Google
 * Maneja la lógica de autenticación con Google y Supabase, y notifica si se requiere registro adicional
 * @param param0
 * @returns
 */
export const GoogleSignInButton = ({
  onRegisterRequired,
}: GoogleSignInButtonProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "523016434812-cnv5ss42d64cjmqrgdu0lt8tuud1igk8.apps.googleusercontent.com",
      scopes: ["profile", "email"],
    });
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response: any = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken || response?.idToken;

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        if (error) throw error;

        if (data?.user) {
          const { data: dbUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.user.id)
            .single();

          if (!dbUser && onRegisterRequired) {
            const meta = data.user.user_metadata || {};
            onRegisterRequired({
              email: data.user.email || "",
              name: meta.full_name || meta.name || "",
              photo: meta.avatar_url || meta.picture || "",
            });
          }
        }
      } else {
        throw new Error("No se recibió el Token de Google");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Error", "El inicio de sesión ya está en curso");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          "Error",
          "Google Play Services no está disponible en este dispositivo",
        );
      } else {
        Alert.alert(
          "Error",
          error.message || "Ocurrió un error al iniciar sesión con Google",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t("common.or")}</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator
            color={colors.textPrimary}
            style={{ marginRight: 10 }}
          />
        ) : (
          <AntDesign
            name="google"
            size={24}
            color={colors.textPrimary}
            style={{ marginRight: 10 }}
          />
        )}
        <Text style={styles.googleButtonText}>{t("google.continue")}</Text>
      </TouchableOpacity>
    </>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: {
      color: colors.textSecondary,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    googleButton: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    googleButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
  });

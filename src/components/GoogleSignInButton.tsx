import { AntDesign } from "@expo/vector-icons";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../config/supabase";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

interface GoogleSignInButtonProps {
  onRegisterRequired?: (userData: {
    email: string;
    name: string;
    photo: string;
  }) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const GoogleSignInButton = ({
  onRegisterRequired,
  onLoadingChange,
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
    onLoadingChange?.(true);
    try {
      await GoogleSignin.hasPlayServices();

      try {
        await GoogleSignin.signOut();
      } catch (e) {}

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
            .select("id, height")
            .eq("id", data.user.id)
            .single();

          if ((!dbUser || !dbUser.height) && onRegisterRequired) {
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
      onLoadingChange?.(false);
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
        <AntDesign
          name="google"
          size={scale(24)}
          color={colors.textPrimary}
          style={{ marginRight: scale(10) }}
        />
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
      marginVertical: verticalScale(20),
    },
    dividerLine: {
      flex: 1,
      height: verticalScale(1),
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textSecondary,
      paddingHorizontal: scale(10),
      fontSize: moderateScale(14),
    },
    googleButton: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: scale(15),
      borderRadius: scale(10),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    googleButtonText: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "600",
    },
  });

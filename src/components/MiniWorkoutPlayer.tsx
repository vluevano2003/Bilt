import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

/**
 * Componente que muestra un mini reproductor de entrenamiento activo en la parte inferior de la pantalla, permitiendo al usuario ver el nombre del entrenamiento, el tiempo transcurrido y cancelar el entrenamiento si lo desea.
 * @returns
 */
export const MiniWorkoutPlayer = () => {
  const { t } = useTranslation();
  const { activeRoutine, elapsedSeconds, cancelWorkout } = useActiveWorkout();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isTabBarVisible =
    pathname === "/home" || pathname === "/social" || pathname === "/profile";

  const styles = getStyles(colors, insets.bottom, isTabBarVisible);

  if (!activeRoutine || pathname === "/activeWorkout" || pathname === "/" || !user) return null;

  /**
   * Función que formatea el tiempo transcurrido en minutos y segundos, asegurándose de que siempre se muestren dos dígitos para cada unidad de tiempo.
   * @param totalSeconds
   * @returns
   */
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Función que muestra una alerta de confirmación antes de cancelar el entrenamiento activo, permitiendo al usuario decidir si realmente desea cancelar o no.
   * Si el usuario confirma la cancelación, se llama a la función `cancelWorkout` para finalizar el entrenamiento activo.
   */
  const handleCancel = () => {
    Alert.alert(
      t("activeWorkout.cancelAlertTitle"),
      t("activeWorkout.cancelAlertMsg"),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("activeWorkout.yesCancel"),
          style: "destructive",
          onPress: () => cancelWorkout(),
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push("/activeWorkout")}
    >
      <View style={styles.iconContainer}>
        <Feather name="activity" size={scale(20)} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {t("activeWorkout.trainingLabel")}: {activeRoutine.name}
        </Text>
        <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
      </View>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
        <Feather name="x" size={scale(20)} color={colors.textPrimary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, bottomInset: number, isTabBarVisible: boolean) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: isTabBarVisible ? verticalScale(60) + bottomInset : 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      paddingTop: scale(12),
      paddingBottom: isTabBarVisible ? scale(12) : bottomInset > 0 ? bottomInset + scale(5) : scale(12),
      paddingHorizontal: scale(15),
      zIndex: 1000,
    },
    iconContainer: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: scale(12),
    },
    info: {
      flex: 1,
      justifyContent: "center",
    },
    title: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(15),
    },
    time: {
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: "700",
      fontSize: moderateScale(13),
      marginTop: verticalScale(2),
      fontVariant: ["tabular-nums"],
    },
    cancelBtn: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: scale(10),
    },
  });

import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

/**
 * Componente que muestra un mini reproductor de entrenamiento activo en la parte inferior de la pantalla, permitiendo al usuario ver el nombre del entrenamiento, el tiempo transcurrido y cancelar el entrenamiento si lo desea.
 * @returns
 */
export const MiniWorkoutPlayer = () => {
  const { t } = useTranslation();
  const { activeRoutine, elapsedSeconds, cancelWorkout } = useActiveWorkout();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets.bottom);

  if (!activeRoutine || pathname === "/activeWorkout") return null;

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
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {t("activeWorkout.trainingLabel")}: {activeRoutine.name}
        </Text>
        <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
      </View>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
        <Feather name="x" size={scale(20)} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, bottomInset: number) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: verticalScale(75) + bottomInset,
      left: scale(15),
      right: scale(15),
      backgroundColor: colors.primary,
      borderRadius: scale(12),
      flexDirection: "row",
      alignItems: "center",
      padding: scale(15),
      elevation: 10,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(5),
    },
    info: {
      flex: 1,
    },
    title: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(15),
    },
    time: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: moderateScale(13),
      marginTop: verticalScale(2),
      fontVariant: ["tabular-nums"],
    },
    cancelBtn: {
      padding: scale(8),
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: scale(20),
      marginLeft: scale(10),
    },
  });

import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const MiniWorkoutPlayer = () => {
  const { t } = useTranslation();
  const { activeRoutine, elapsedSeconds, cancelWorkout } = useActiveWorkout();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets.bottom);

  if (!activeRoutine || pathname === "/activeWorkout") return null;

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    Alert.alert(
      t("activeWorkout.cancelAlertTitle", "Cancelar entrenamiento"),
      t(
        "activeWorkout.cancelAlertMsg",
        "¿Seguro que deseas cancelar el entrenamiento actual? Perderás el progreso de esta sesión.",
      ),
      [
        { text: t("common.back", "Volver"), style: "cancel" },
        {
          text: t("activeWorkout.yesCancel", "Sí, cancelar"),
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

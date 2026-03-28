import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import { useTheme } from "../context/ThemeContext";

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
      <TouchableOpacity style={styles.cancelBtn} onPress={cancelWorkout}>
        <Feather name="x" size={20} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, bottomInset: number) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 75 + bottomInset,
      left: 15,
      right: 15,
      backgroundColor: colors.primary,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      elevation: 10,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    info: {
      flex: 1,
    },
    title: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 15,
    },
    time: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 13,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    cancelBtn: {
      padding: 8,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: 20,
      marginLeft: 10,
    },
  });

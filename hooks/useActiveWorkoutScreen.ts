import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useActiveWorkout } from "../src/context/ActiveWorkoutContext";
import { useRoutines } from "./useRoutines";

export const useActiveWorkoutScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveRoutine } = useRoutines();
  const activeWorkoutCtx = useActiveWorkout();
  const {
    activeRoutine,
    originalRoutine,
    setIsPaused,
    cancelWorkout,
    finishWorkout,
  } = activeWorkoutCtx;
  const [showSummary, setShowSummary] = useState(false);
  const [stats, setStats] = useState({ volume: 0, sets: 0 });

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleMinimize = () => router.back();

  /**
   * Compara la rutina activa con la original ignorando el estado de "completed" en los sets para determinar si se han hecho modificaciones significativas que podrían querer guardarse en la plantilla. Si no hay rutina activa o original, asume que no hay modificaciones.
   */
  const checkModifications = () => {
    if (!activeRoutine || !originalRoutine) return false;

    const cleanActive = activeRoutine.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map(({ completed, ...rest }) => rest),
    }));
    const cleanOriginal = originalRoutine.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map(({ completed, ...rest }) => rest),
    }));

    return JSON.stringify(cleanActive) !== JSON.stringify(cleanOriginal);
  };

  /**
   * Calcula el volumen total y el número de sets completados, luego muestra el resumen. Se llama después de finalizar el entrenamiento, y también si el usuario decide no actualizar la plantilla a pesar de haber hecho modificaciones
   */
  const calculateAndShowSummary = () => {
    if (!activeRoutine) return;
    let volume = 0;
    let completedSetsCount = 0;

    activeRoutine.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          completedSetsCount++;
          if (set.weight && set.weight > 0) {
            volume += set.weight * set.reps;
          }
        }
      });
    });

    setStats({ volume, sets: completedSetsCount });
    setShowSummary(true);
  };

  const handleFinishWorkout = () => {
    setIsPaused(true);
    Alert.alert(
      t("activeWorkout.finishAlertTitle"),
      t("activeWorkout.finishAlertMsg"),
      [
        {
          text: t("common.back"),
          style: "cancel",
          onPress: () => setIsPaused(false),
        },
        {
          text: t("activeWorkout.yesFinish"),
          style: "default",
          onPress: async () => {
            const hasModifications = checkModifications();
            const isReadonly = !!activeRoutine?.originalCreatorId;

            if (hasModifications && !isReadonly) {
              Alert.alert(
                t("activeWorkout.updateTemplateTitle"),
                t("activeWorkout.updateTemplateMsg"),
                [
                  {
                    text: t("activeWorkout.keepOriginalBtn"),
                    style: "cancel",
                    onPress: () => calculateAndShowSummary(),
                  },
                  {
                    text: t("activeWorkout.updateTemplateBtn"),
                    style: "default",
                    onPress: async () => {
                      const cleanExercises = activeRoutine!.exercises.map(
                        (ex) => ({
                          ...ex,
                          sets: ex.sets.map((s) => ({
                            ...s,
                            completed: false,
                          })),
                        }),
                      );
                      await saveRoutine(
                        activeRoutine!.id,
                        activeRoutine!.name,
                        cleanExercises,
                      );
                      calculateAndShowSummary();
                    },
                  },
                ],
              );
            } else {
              calculateAndShowSummary();
            }
          },
        },
      ],
    );
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    finishWorkout();
    router.back();
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      t("activeWorkout.cancelAlertTitle"),
      t("activeWorkout.cancelAlertMsg"),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("activeWorkout.yesCancel"),
          style: "destructive",
          onPress: () => {
            cancelWorkout();
            router.back();
          },
        },
      ],
    );
  };

  return {
    t,
    router,
    showSummary,
    stats,
    formatTime,
    formatRestTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    ...activeWorkoutCtx,
  };
};

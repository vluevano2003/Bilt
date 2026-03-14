import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useActiveWorkout } from "../src/context/ActiveWorkoutContext";
import { useProfile } from "./useProfile";
import { useRoutines } from "./useRoutines";

/**
 * Hook para manejar la lógica de la pantalla de workout activo, incluyendo el cálculo de estadísticas, manejo de tiempo, y acciones como finalizar o cancelar el workout
 * @returns
 */
export const useActiveWorkoutScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveRoutine } = useRoutines();
  const activeWorkoutCtx = useActiveWorkout();
  const { measurementSystem } = useProfile();
  const {
    activeRoutine,
    originalRoutine,
    setIsPaused,
    cancelWorkout,
    finishWorkout,
    updateExerciseRestTime,
    changeExerciseUnit,
  } = activeWorkoutCtx;

  /**
   * Función para convertir el peso de una serie al sistema de medida del usuario antes de calcular el volumen
   */
  const getConvertedWeight = (itemWeight: number, unit: string) => {
    const w = Number(itemWeight) || 0;
    if (measurementSystem === "metric" && unit === "lbs") return w * 0.453592;
    if (measurementSystem === "imperial" && unit === "kg") return w * 2.20462;
    return w;
  };

  let stats = { volume: 0, sets: 0 };
  if (activeRoutine) {
    activeRoutine.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          stats.sets++;
          const validVolumeUnits = ["kg", "lbs", "bodyweight"];
          if (
            set.weight &&
            set.weight > 0 &&
            validVolumeUnits.includes(set.weightUnit)
          ) {
            const convertedWeight = getConvertedWeight(
              set.weight,
              set.weightUnit,
            );
            stats.volume += convertedWeight * set.reps;
          }
        }
      });
    });
  }

  stats.volume = Math.round(stats.volume);

  const [showSummary, setShowSummary] = useState(false);

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

  const calculateAndShowSummary = () => {
    setShowSummary(true);
  };

  /**
   * Función para manejar el cierre del workout, mostrando un alert de confirmación y luego otro si hay modificaciones en la rutina para decidir si actualizar la plantilla o no. Finalmente muestra el resumen del workout
   */
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
    measurementSystem,
    formatTime,
    formatRestTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    ...activeWorkoutCtx,
  };
};

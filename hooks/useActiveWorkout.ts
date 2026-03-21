import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useActiveWorkout } from "../src/context/ActiveWorkoutContext";
import { useAuth } from "../src/context/AuthContext";
import { useProfile } from "./useProfile";
import { useRoutines } from "./useRoutines";
import { useUserActivity } from "./useUserActivity";

/**
 * Hook para manejar la lógica de la pantalla de workout activo, incluyendo:
- Cálculo de estadísticas en tiempo real (volumen, distribución muscular)
- Formateo de tiempos y pesos
- Manejo de acciones del usuario (finalizar, cancelar, minimizar)
- Comparación con el historial para mostrar el último set realizado
 * @returns 
 */
export const useActiveWorkoutScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveRoutine } = useRoutines();
  const activeWorkoutCtx = useActiveWorkout();
  const { measurementSystem, weight: userWeightString } = useProfile();
  const { user } = useAuth();
  const { userHistory } = useUserActivity(user?.id);

  const [isSavingHistory, setIsSavingHistory] = useState(false);

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
   * Convierte el peso de un set a kg o lbs según el sistema de medición del usuario, y maneja casos especiales como peso corporal, barras y discos
   * @param itemWeight
   * @param unit
   * @returns
   */
  const getConvertedWeight = (itemWeight: number, unit: string) => {
    if (unit === "bars" || unit === "plates") return 0;

    let w = Number(itemWeight) || 0;
    const userW = Number(userWeightString) || 0;

    if (unit === "bodyweight") {
      w += userW;
    } else {
      if (measurementSystem === "metric" && unit === "lbs") w = w * 0.453592;
      if (measurementSystem === "imperial" && unit === "kg") w = w * 2.20462;
    }
    return w;
  };

  /**
   * Busca en el historial del usuario el último set realizado para un ejercicio específico y devuelve una cadena formateada con el peso y las repeticiones, o "-" si no se encuentra información relevante
   * @param exerciseId
   * @param setIndex
   * @returns
   */
  const getPreviousSet = (exerciseId: string, setIndex: number) => {
    if (!userHistory || userHistory.length === 0) return "-";

    for (const session of userHistory) {
      const pastExercise = session.exercises?.find(
        (ex: any) => ex.exerciseDetails?.id === exerciseId,
      );

      if (pastExercise && pastExercise.sets && pastExercise.sets[setIndex]) {
        const pastSet = pastExercise.sets[setIndex];

        if (
          pastSet.weight > 0 ||
          pastSet.reps > 0 ||
          pastSet.weightUnit === "bodyweight"
        ) {
          let formattedWeight = "";

          if (
            pastSet.weightUnit === "bars" ||
            pastSet.weightUnit === "plates"
          ) {
            formattedWeight = `${pastSet.weight} ${t(`unitSelection.${pastSet.weightUnit}`)}`;
          } else if (pastSet.weightUnit === "bodyweight") {
            formattedWeight =
              pastSet.weight > 0 ? `BW + ${pastSet.weight}` : "BW";
          } else {
            const unit = pastSet.weightUnit === "lbs" ? "lb" : "kg";
            formattedWeight = `${pastSet.weight}${unit}`;
          }

          return `${formattedWeight} x ${pastSet.reps}`;
        }
      }
    }
    return "-";
  };

  let stats = { volume: 0, sets: 0 };
  let muscleCounts: Record<string, number> = {};

  if (activeRoutine) {
    activeRoutine.exercises.forEach((ex) => {
      const muscle = ex.exerciseDetails.muscleGroup;

      ex.sets.forEach((set) => {
        if (set.completed) {
          stats.sets++;
          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;

          const convertedWeight = getConvertedWeight(
            set.weight,
            set.weightUnit,
          );
          stats.volume += convertedWeight * set.reps;
        }
      });
    });
  }

  stats.volume = Math.round(stats.volume);

  const muscleDistribution = Object.keys(muscleCounts)
    .map((key) => {
      return {
        name: key,
        percentage: (muscleCounts[key] / stats.sets) * 100,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const [showSummary, setShowSummary] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${seconds}s`;
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

  const handleCloseSummary = async () => {
    setIsSavingHistory(true);
    await finishWorkout();
    setIsSavingHistory(false);
    setShowSummary(false);
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
    muscleDistribution,
    measurementSystem,
    formatTime,
    formatRestTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    getPreviousSet,
    isSavingHistory,
    ...activeWorkoutCtx,
  };
};

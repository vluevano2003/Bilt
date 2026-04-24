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
 * - Cálculo de estadísticas en tiempo real (volumen, distribución muscular)
 * - Formateo de tiempos y pesos
 * - Manejo de acciones del usuario (finalizar, cancelar, minimizar)
 * - Comparación con el historial para mostrar el último set realizado
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
  const [showSummary, setShowSummary] = useState(false);

  const {
    activeRoutine,
    originalRoutine,
    setIsPaused,
    cancelWorkout,
    finishWorkout,
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

  /**
   * Calcula la distribución muscular como un porcentaje de sets completados por grupo muscular, ordenado de mayor a menor para mostrar en la UI. Esto permite al usuario ver rápidamente qué grupos musculares ha trabajado más durante el workout activo.
   */
  const muscleDistribution = Object.keys(muscleCounts)
    .map((key) => ({
      name: key,
      percentage: (muscleCounts[key] / stats.sets) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  /**
   * Formatea un tiempo dado en segundos a una cadena legible, mostrando horas y minutos si el tiempo es suficientemente largo, o minutos y segundos para tiempos más cortos. Esto se utiliza para mostrar el tiempo transcurrido del workout activo y el tiempo de descanso restante de manera clara para el usuario.
   * @param totalSeconds
   * @returns
   */
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${seconds}s`;
  };

  /**
   * Formatea el tiempo de descanso restante en minutos y segundos, asegurándose de que los segundos siempre se muestren con dos dígitos para una apariencia consistente. Esto mejora la experiencia del usuario al mostrar claramente cuánto tiempo queda en el descanso entre sets o ejercicios.
   * @param seconds
   * @returns
   */
  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleMinimize = () => router.back();

  /**
   * Compara el estado actual del workout activo con la rutina original para detectar si el usuario ha realizado modificaciones, como agregar o eliminar ejercicios o sets. Si se detectan cambios, se muestra una alerta al finalizar el workout preguntando si desea actualizar la plantilla original con las modificaciones realizadas. Esto permite al usuario mantener su plantilla actualizada con los cambios que hizo durante el workout activo, o conservar la plantilla original si prefiere no actualizarla.
   * @returns
   */
  const checkModifications = () => {
    if (!activeRoutine || !originalRoutine) return false;

    if (activeRoutine.exercises.length !== originalRoutine.exercises.length) {
      return true;
    }

    for (const activeEx of activeRoutine.exercises) {
      const originalEx = originalRoutine.exercises.find(
        (origEx) => origEx.id === activeEx.id,
      );

      if (!originalEx) return true;

      if (activeEx.sets.length !== originalEx.sets.length) {
        return true;
      }
    }

    return false;
  };

  /**
   * Abre el modal INMEDIATAMENTE y lanza el guardado a base de datos de fondo. Si hay un error, cierra el modal para que puedas intentar de nuevo. Cuando le das "Cerrar" en el modal, ahora sí destruye todo.
   */
  const calculateAndShowSummary = async () => {
    setShowSummary(true);
    setIsSavingHistory(true);
    try {
      await finishWorkout();
    } catch (error) {
      setShowSummary(false);
    } finally {
      setIsSavingHistory(false);
    }
  };

  /**
   * Maneja la acción de finalizar el workout activo, incluyendo la detección de modificaciones en la rutina, la presentación de alertas para confirmar la acción y ofrecer la opción de actualizar la plantilla original.
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
                      try {
                        const cleanExercises = activeRoutine!.exercises.map(
                          (ex) => ({
                            ...ex,
                            sets: ex.sets.map((s) => ({
                              ...s,
                              completed: false,
                            })),
                          }),
                        );

                        const savePromise = saveRoutine(
                          activeRoutine!.id,
                          activeRoutine!.name,
                          cleanExercises,
                        );
                        const timeoutPromise = new Promise((_, reject) =>
                          setTimeout(
                            () => reject(new Error(t("errors.timeout"))),
                            8000,
                          ),
                        );

                        await Promise.race([savePromise, timeoutPromise]);
                        calculateAndShowSummary();
                      } catch (e) {
                        Alert.alert(
                          t("profile.alerts.error"),
                          t("errors.networkFailed"),
                        );
                        setIsPaused(false);
                      }
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

  /**
   * Como la información ya se guardó con calculateAndShowSummary, este botón ya solo tiene la responsabilidad de destruir los datos en memoria y sacarte de la pantalla de entrenamiento.
   */
  const handleCloseSummary = () => {
    cancelWorkout();
    setShowSummary(false);
    router.back();
  };

  /**
   * Maneja la acción de cancelar el workout activo, mostrando una alerta para confirmar la acción y advirtiendo al usuario que se perderán los datos no guardados. Si el usuario confirma que desea cancelar, se llama a la función de cancelación del workout y luego se navega de regreso a la pantalla anterior.
   */
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

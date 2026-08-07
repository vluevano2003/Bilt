import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useActiveWorkout } from "../src/context/ActiveWorkoutContext";
import { useAuth } from "../src/context/AuthContext";
import { useProfile } from "./useProfile";
import { useRoutines } from "./useRoutines";
import { useUserActivity } from "./useUserActivity";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

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
  const { saveRoutine, exercisesDb } = useRoutines();
  const activeWorkoutCtx = useActiveWorkout();
  const { measurementSystem, weight: userWeightString } = useProfile();
  const { user } = useAuth();
  const { userHistory } = useUserActivity(user?.id);

  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const {
    activeRoutine,
    originalRoutine,
    elapsedSeconds,
    isPaused,
    restTimeRemaining,
    isResting,
    isLoaded,
    isStarting,
    startWorkout,
    resumeWorkout,
    pauseWorkout,
    cancelWorkout,
    finishWorkout,
    handleSetChange,
    changeExerciseUnit,
    addSetToExercise,
    removeSetFromExercise,
    toggleSetCompletion,
    stopRestTimer,
    adjustRestTime,
    reorderActiveExercises,
    setIsPaused,
    updateExerciseRestTime,
    addExercisesToActiveRoutine,
    removeExerciseFromActiveRoutine,
  } = activeWorkoutCtx;

  /**
   * Convierte el peso de un set a kg o lbs según el sistema de medición del usuario, y maneja casos especiales como peso corporal, barras y discos
   * @param itemWeight
   * @param unit
   * @returns
   */
  const getConvertedWeight = (itemWeight: number, unit: string, userWeightOverride?: string) => {
    if (unit === "bars" || unit === "plates" || unit === "km" || unit === "mi")
      return 0;

    let w = Number(itemWeight) || 0;
    const userW = Number(userWeightOverride ?? userWeightString) || 0;

    if (unit === "bodyweight") {
      w += userW;
    } else {
      if (measurementSystem === "metric" && unit === "lbs") w = w * 0.453592;
      if (measurementSystem === "imperial" && unit === "kg") w = w * 2.20462;
    }
    return w;
  };

  /**
   * Busca en el historial del usuario la última sesión que contenga el ejercicio específico y devuelve los datos de la serie anterior para mostrar como referencia en la UI. Esto permite al usuario comparar su rendimiento actual con su último intento registrado para ese ejercicio, proporcionando motivación y contexto durante el workout activo.
   */
  const getPreviousSet = useCallback(
    (globalExerciseId: string, setIndex: number) => {
      if (!userHistory || userHistory.length === 0) return "-";

      const sortedHistory = [...userHistory].sort((a, b) => {
        const dateA = new Date(a.completedAt || 0).getTime();
        const dateB = new Date(b.completedAt || 0).getTime();
        return dateB - dateA;
      });

      for (const session of sortedHistory) {
        const pastExercise = session.exercises?.find(
          (ex: any) => ex.exerciseDetails?.id === globalExerciseId,
        );

        if (pastExercise && pastExercise.sets && pastExercise.sets[setIndex]) {
          const pastSet = pastExercise.sets[setIndex];

          if (
            pastSet.weight > 0 ||
            pastSet.reps > 0 ||
            pastSet.weightUnit === "bodyweight"
          ) {
            if (pastSet.weightUnit === "km" || pastSet.weightUnit === "mi") {
              const translatedUnit = t(
                `activeWorkout.units.${pastSet.weightUnit}`,
              );
              return `${pastSet.weight} ${translatedUnit} x ${pastSet.reps} min`;
            }

            let formattedWeight = "";

            if (
              pastSet.weightUnit === "bars" ||
              pastSet.weightUnit === "plates"
            ) {
              const translatedUnit = t(
                `activeWorkout.units.${pastSet.weightUnit}`,
              );
              formattedWeight = `${pastSet.weight} ${translatedUnit}`;
            } else if (pastSet.weightUnit === "bodyweight") {
              let unitToDisplay = pastSet.bwUnit;
              if (!unitToDisplay) {
                pastExercise.sets.forEach((st: any) => {
                  if (st.weightUnit === "kg" || st.weightUnit === "lbs") {
                    unitToDisplay = st.weightUnit === "lbs" ? "lb" : "kg";
                  }
                });
                if (!unitToDisplay) {
                  unitToDisplay = measurementSystem === "imperial" ? "lb" : "kg";
                }
              }
              formattedWeight =
                pastSet.weight > 0 ? `BW+${pastSet.weight} ${unitToDisplay}` : "BW";
            } else {
              const unit = pastSet.weightUnit === "lbs" ? "lb" : "kg";
              formattedWeight = `${pastSet.weight}${unit}`;
            }

            return `${formattedWeight} x ${pastSet.reps}`;
          }
        }
      }
      return "-";
    },
    [userHistory, t],
  );

  /**
   * Obtiene el historial detallado de un ejercicio (últimos 5 entrenamientos, max peso, max volumen, etc.)
   */
  const getExerciseHistoryDetails = useCallback(
    (globalExerciseId: string) => {
      if (!userHistory || userHistory.length === 0) return null;

      const sortedHistory = [...userHistory].sort((a, b) => {
        const dateA = new Date(a.completedAt || 0).getTime();
        const dateB = new Date(b.completedAt || 0).getTime();
        return dateB - dateA;
      });

      const sessions: any[] = [];
      let maxWeight = 0;
      let maxWeightConverted = 0;
      let maxWeightUnit = "";
      let maxWeightSet: any = null;

      let maxVolume = 0;
      let maxVolumeConverted = 0;
      let maxVolumeUnit = "";
      let maxVolumeSets: any[] = [];

      let maxBars = 0;
      let maxPlates = 0;

      for (const session of sortedHistory) {
        const pastExercise = session.exercises?.find(
          (ex: any) => ex.exerciseDetails?.id === globalExerciseId,
        );

        if (pastExercise && pastExercise.sets && pastExercise.sets.length > 0) {
          const completedSets = pastExercise.sets.filter(
            (s: any) => (s.weight > 0 || s.reps > 0 || s.weightUnit === "bodyweight") && s.type !== "warmup"
          );

          if (completedSets.length > 0) {
            let sessionMaxWeight = 0;

            let inferredUnit = measurementSystem === "metric" ? "kg" : "lbs";
            session.exercises?.forEach((e: any) => {
              e.sets?.forEach((st: any) => {
                if (st.weightUnit === "kg" || st.weightUnit === "lbs") {
                  inferredUnit = st.weightUnit;
                }
              });
            });

            completedSets.forEach((s: any) => {
              if (s.weightUnit === "bars") {
                if (s.weight > maxBars) maxBars = s.weight;
              } else if (s.weightUnit === "plates") {
                if (s.weight > maxPlates) maxPlates = s.weight;
              } else if (s.weightUnit !== "km" && s.weightUnit !== "mi") {
                const effectiveUnit = s.weightUnit === "bodyweight" ? (s.bwUnit || inferredUnit) : s.weightUnit;
                const effectiveUserWeight = s.bwUserWeight || userWeightString;
                const convertedWeight = getConvertedWeight(s.weight, effectiveUnit, effectiveUserWeight);

                const trueWeight = s.weightUnit === "bodyweight" ? (Number(s.weight) + Number(effectiveUserWeight || 0)) : s.weight;
                const trueUnit = s.weightUnit === "bodyweight" ? (s.bwUnit || inferredUnit) : s.weightUnit;

                if (convertedWeight > sessionMaxWeight) sessionMaxWeight = convertedWeight;

                if (convertedWeight > maxWeightConverted) {
                  maxWeightConverted = convertedWeight;
                  maxWeight = trueWeight;
                  maxWeightUnit = trueUnit;
                  maxWeightSet = s;
                }

                // Calcular volumen de ESTA serie individual
                const setVolume = trueWeight * s.reps;
                const setVolumeConverted = convertedWeight * s.reps;

                if (setVolumeConverted > maxVolumeConverted) {
                  maxVolumeConverted = setVolumeConverted;
                  maxVolume = setVolume;
                  maxVolumeUnit = trueUnit;
                  maxVolumeSets = [s];
                }
              } else if (s.weightUnit === "km" || s.weightUnit === "mi") {
                // For cardio
                if (s.weight > maxWeight) {
                  maxWeight = s.weight;
                  maxWeightUnit = s.weightUnit;
                  maxWeightSet = s;
                }
              }
            });

            sessions.push({
              date: session.completedAt,
              routineName: session.routineName,
              sets: completedSets,
              maxWeight: sessionMaxWeight,
            });
          }
        }
      }

      if (sessions.length === 0) return null;

      return {
        recentSessions: sessions.slice(0, 5),
        maxWeight,
        maxWeightUnit: maxWeightUnit || (measurementSystem === "metric" ? "kg" : "lbs"),
        maxWeightSet,
        maxVolume,
        maxVolumeUnit: maxVolumeUnit || (measurementSystem === "metric" ? "kg" : "lbs"),
        maxVolumeSets,
        maxBars,
        maxPlates,
        chartData: sessions.slice(0, 15).reverse().filter(s => s.maxWeight > 0).map(s => ({ date: s.date, weight: s.maxWeight })),
      };
    },
    [userHistory, measurementSystem, userWeightString],
  );

  const stats = useMemo(() => {
    let volume = 0;
    let completedSets = 0;

    activeRoutine?.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          completedSets++;
          const convertedWeight = getConvertedWeight(
            set.weight,
            set.weightUnit,
          );
          volume += convertedWeight * set.reps;
        }
      });
    });

    return { volume: Math.round(volume), sets: completedSets };
  }, [activeRoutine, measurementSystem, userWeightString]);

  /**
   * Calcula la distribución muscular como un porcentaje de sets completados por grupo muscular, ordenado de mayor a menor para mostrar en la UI. Esto permite al usuario ver rápidamente qué grupos musculares ha trabajado más durante el workout activo.
   */
  const muscleDistribution = useMemo(() => {
    if (!activeRoutine) return [];
    const counts: Record<string, number> = {};
    let total = 0;

    activeRoutine.exercises.forEach((ex) => {
      const currentExDb = exercisesDb?.find((dbEx) => dbEx.id === ex.exerciseDetails.id);
      const muscle = currentExDb ? currentExDb.muscleGroup : ex.exerciseDetails.muscleGroup;
      const completedInEx = ex.sets.filter((s) => s.completed).length;
      if (completedInEx > 0) {
        counts[muscle] = (counts[muscle] || 0) + completedInEx;
        total += completedInEx;
      }
    });

    return Object.keys(counts)
      .map((m) => ({
        name: m,
        percentage: (counts[m] / total) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [activeRoutine, exercisesDb]);

  /**
   * Formatea un tiempo dado en segundos a una cadena legible, mostrando horas y minutos si el tiempo es suficientemente largo, o minutos y segundos para tiempos más cortos. Esto se utiliza para mostrar el tiempo transcurrido del workout activo y el tiempo de descanso restante de manera clara para el usuario.
   * @param totalSeconds
   * @returns
   */
  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${seconds}s`;
  }, []);

  /**
   * Formatea el tiempo de descanso restante en minutos y segundos, asegurándose de que los segundos siempre se muestren con dos dígitos para una apariencia consistente. Esto mejora la experiencia del usuario al mostrar claramente cuánto tiempo queda en el descanso entre sets o ejercicios.
   * @param seconds
   * @returns
   */
  const formatRestTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

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

    for (let i = 0; i < activeRoutine.exercises.length; i++) {
      const activeEx = activeRoutine.exercises[i];
      const originalEx = originalRoutine.exercises[i];

      // Reordenar cuenta como modificación
      if (activeEx.id !== originalEx.id) {
        return true;
      }

      if (activeEx.sets.length !== originalEx.sets.length) {
        return true;
      }

      // Cambio de unidad cuenta como modificación
      for (let j = 0; j < activeEx.sets.length; j++) {
        if (activeEx.sets[j].weightUnit !== originalEx.sets[j].weightUnit) {
          return true;
        }
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
      await finishWorkout(measurementSystem, userWeightString);
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
    const completedCount = activeRoutine?.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );

    if (!completedCount || completedCount === 0) {
      Alert.alert(
        t("activeWorkout.emptyWorkoutTitle"),
        t("activeWorkout.emptyWorkoutMsg"),
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
      return;
    }

    setIsPaused(true);
    Alert.alert(
      t("activeWorkout.finishAlertTitle"),
      t("activeWorkout.finishAlertMsg"),
      [
        {
          text: t("common.cancel"),
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
    getExerciseHistoryDetails,
    isSavingHistory,
    ...activeWorkoutCtx,
  };
};

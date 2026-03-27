import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Audio } from "expo-av";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Vibration } from "react-native";
import {
  ExerciseSet,
  Routine,
  RoutineExercise,
  WeightUnit,
} from "../../hooks/useRoutines";
import { supabase } from "../config/supabase";
import { useAuth } from "./AuthContext";

interface ActiveWorkoutContextProps {
  activeRoutine: Routine | null;
  originalRoutine: Routine | null;
  elapsedSeconds: number;
  isPaused: boolean;
  restTimeRemaining: number | null;
  isResting: boolean;
  startWorkout: (routine: Routine) => void;
  resumeWorkout: () => void;
  pauseWorkout: () => void;
  cancelWorkout: () => void;
  finishWorkout: () => Promise<void>;
  handleSetChange: (
    exId: string,
    setId: string,
    field: "weight" | "reps",
    val: string,
  ) => void;
  changeExerciseUnit: (exId: string, newUnit: WeightUnit) => void;
  addSetToExercise: (exId: string) => void;
  removeSetFromExercise: (exId: string, setId: string) => void;
  toggleSetCompletion: (
    exId: string,
    setId: string,
    defaultRest: number,
  ) => void;
  adjustRestTime: (secs: number) => void;
  stopRestTimer: () => void;
  reorderActiveExercises: (newExercises: RoutineExercise[]) => void;
  setIsPaused: (val: boolean) => void;
  updateExerciseRestTime: (exId: string, newTime: number) => void;
}

export const ActiveWorkoutContext =
  createContext<ActiveWorkoutContextProps | null>(null);

const STORAGE_KEY = "active_workout_state";

export const ActiveWorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [originalRoutine, setOriginalRoutine] = useState<Routine | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(
    null,
  );
  const [isResting, setIsResting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedWorkout = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setActiveRoutine(parsedState.activeRoutine);
          setOriginalRoutine(parsedState.originalRoutine);
          setElapsedSeconds(parsedState.elapsedSeconds);
          setIsPaused(parsedState.isPaused);
          setRestTimeRemaining(parsedState.restTimeRemaining);
          setIsResting(parsedState.isResting);

          if (
            parsedState.lastSavedTime &&
            parsedState.isResting &&
            parsedState.restTimeRemaining > 0
          ) {
            const secondsPassedSinceClosed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            const newRestTime =
              parsedState.restTimeRemaining - secondsPassedSinceClosed;
            if (newRestTime > 0) {
              setRestTimeRemaining(newRestTime);
            } else {
              setRestTimeRemaining(0);
              setIsResting(false);
            }
          }

          if (parsedState.lastSavedTime && !parsedState.isPaused) {
            const secondsPassedSinceClosed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            setElapsedSeconds((prev) => prev + secondsPassedSinceClosed);
          }
        }
      } catch (e) {
        console.log("No se pudo cargar el entrenamiento guardado", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedWorkout();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const saveWorkoutState = async () => {
      if (activeRoutine) {
        const stateToSave = {
          activeRoutine,
          originalRoutine,
          elapsedSeconds,
          isPaused,
          restTimeRemaining,
          isResting,
          lastSavedTime: Date.now(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    };

    saveWorkoutState();
  }, [
    activeRoutine,
    elapsedSeconds,
    isPaused,
    restTimeRemaining,
    isResting,
    isLoaded,
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeRoutine && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, isPaused]);

  const playTimerEndSound = async () => {
    try {
      Vibration.vibrate(500);
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep.mp3"),
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.log("Error de sonido", error);
    }
  };

  useEffect(() => {
    let restInterval: ReturnType<typeof setInterval>;
    if (
      isResting &&
      restTimeRemaining !== null &&
      restTimeRemaining > 0 &&
      !isPaused
    ) {
      restInterval = setInterval(() => {
        setRestTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (restTimeRemaining === 0) {
      setIsResting(false);
      setRestTimeRemaining(null);
      playTimerEndSound();
    }
    return () => clearInterval(restInterval);
  }, [isResting, restTimeRemaining, isPaused]);

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(JSON.parse(JSON.stringify(routine)));
    setOriginalRoutine(JSON.parse(JSON.stringify(routine)));
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
  };

  const cancelWorkout = async () => {
    setActiveRoutine(null);
    setOriginalRoutine(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const finishWorkout = async () => {
    if (!activeRoutine || !user?.id) {
      cancelWorkout();
      return;
    }

    /**
     * Verificar conexión a internet antes de intentar guardar el entrenamiento
     */
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        "Sin conexión",
        "Tu entrenamiento está a salvo localmente, pero necesitas internet para guardarlo en tu historial. Conéctate a una red e intenta finalizarlo de nuevo.",
      );
      setIsPaused(true);
      return;
    }

    try {
      const completedExercises = activeRoutine.exercises
        .map((ex) => {
          return {
            ...ex,
            sets: ex.sets.filter((set) => set.completed),
          };
        })
        .filter((ex) => ex.sets.length > 0);

      if (completedExercises.length === 0) {
        console.log("No hay series completadas. No se guardará el historial.");
        cancelWorkout();
        return;
      }

      const { error } = await supabase.from("history").insert([
        {
          user_id: user.id,
          routine_id: activeRoutine.id,
          routine_name: activeRoutine.name,
          duration_seconds: elapsedSeconds,
          exercises: completedExercises,
        },
      ]);

      if (error) {
        Alert.alert("Error guardando entrenamiento", error.message);
        throw error;
      }

      console.log("¡Entrenamiento guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar el entrenamiento:", error);
    } finally {
      cancelWorkout();
    }
  };

  const resumeWorkout = () => setIsPaused(false);
  const pauseWorkout = () => setIsPaused(true);

  const reorderActiveExercises = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({ ...activeRoutine, exercises: newExercises });
  };

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => {
    if (!activeRoutine) return;
    const numValue = value === "" ? 0 : Number(value.replace(/[^0-9.]/g, ""));
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) =>
          s.id === setId ? { ...s, [field]: numValue } : s,
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const changeExerciseUnit = (exerciseId: string, newUnit: WeightUnit) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) => ({ ...s, weightUnit: newUnit }));
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: Math.random().toString(36).substr(2, 9),
          type: "normal",
          reps: lastSet ? lastSet.reps : 0,
          weight: lastSet ? lastSet.weight : 0,
          weightUnit: lastSet ? lastSet.weightUnit : "kg",
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId)
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const toggleSetCompletion = (
    exerciseId: string,
    setId: string,
    defaultRestSeconds: number,
  ) => {
    if (!activeRoutine) return;
    let isMarkingAsComplete = false;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            isMarkingAsComplete = !s.completed;
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });

    if (isMarkingAsComplete && !isResting) {
      setRestTimeRemaining(defaultRestSeconds);
      setIsResting(true);
    }
  };

  const adjustRestTime = (secondsToAdd: number) => {
    setRestTimeRemaining((prev) => {
      if (prev === null) return null;
      const newTime = prev + secondsToAdd;
      return newTime > 0 ? newTime : 0;
    });
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestTimeRemaining(null);
  };

  const updateExerciseRestTime = (exId: string, newTime: number) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) =>
      ex.id === exId ? { ...ex, restTimeSeconds: newTime } : ex,
    );
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeRoutine,
        originalRoutine,
        elapsedSeconds,
        isPaused,
        restTimeRemaining,
        isResting,
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
        adjustRestTime,
        stopRestTimer,
        reorderActiveExercises,
        setIsPaused,
        updateExerciseRestTime,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context)
    throw new Error(
      "useActiveWorkout debe usarse dentro de ActiveWorkoutProvider",
    );
  return context;
};

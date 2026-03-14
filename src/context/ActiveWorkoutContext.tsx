import { Audio } from "expo-av";
import { addDoc, collection } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Vibration } from "react-native";
import {
  ExerciseSet,
  Routine,
  RoutineExercise,
  WeightUnit,
} from "../../hooks/useRoutines";
import { auth, db } from "../config/firebase";

/**
 * Contexto para manejar el estado del entrenamiento activo, incluyendo la rutina en curso, el tiempo transcurrido, el estado de pausa, el temporizador de descanso y las funciones para manipular estos estados
 */
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

export const ActiveWorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [originalRoutine, setOriginalRoutine] = useState<Routine | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(
    null,
  );
  const [isResting, setIsResting] = useState(false);

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(JSON.parse(JSON.stringify(routine)));
    setOriginalRoutine(JSON.parse(JSON.stringify(routine)));
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
  };

  const cancelWorkout = () => {
    setActiveRoutine(null);
    setOriginalRoutine(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
  };

  const finishWorkout = async () => {
    if (!activeRoutine || !auth.currentUser) {
      cancelWorkout();
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

      const workoutLog = {
        routineId: activeRoutine.id,
        routineName: activeRoutine.name,
        durationSeconds: elapsedSeconds,
        completedAt: Date.now(),
        exercises: completedExercises,
      };

      const historyRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "history",
      );
      await addDoc(historyRef, workoutLog);

      console.log("¡Entrenamiento guardado en el historial con éxito!");
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

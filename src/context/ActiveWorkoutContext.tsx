import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState, Platform, Vibration } from "react-native";
import {
  ExerciseSet,
  Routine,
  RoutineExercise,
  WeightUnit,
} from "../../hooks/useRoutines";
import { supabase } from "../config/supabase";
import { useAuth } from "./AuthContext";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

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
  addExercisesToActiveRoutine: (newExercises: RoutineExercise[]) => void;
  removeExerciseFromActiveRoutine: (exId: string) => void;
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
  const { t } = useTranslation();

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [originalRoutine, setOriginalRoutine] = useState<Routine | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(
    null,
  );
  const [isResting, setIsResting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isPausedRef = useRef(isPaused);
  const isRestingRef = useRef(isResting);
  const restTimeRemainingRef = useRef(restTimeRemaining);
  const lastTickRef = useRef<number>(Date.now());

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
    isRestingRef.current = isResting;
    restTimeRemainingRef.current = restTimeRemaining;
  }, [isPaused, isResting, restTimeRemaining]);

  useEffect(() => {
    const setupSystem = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        debugLog("Permisos de notificación denegados");
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("rest-timer", {
          name: "Cronómetro de Descanso",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableLights: true,
          lightColor: "#ea580c",
          showBadge: false,
        });
      }
    };
    setupSystem();
  }, []);

  // Registramos el token de notificaciones al iniciar sesión y configuramos listeners
  const scheduleRestNotification = async (seconds: number) => {
    if (currentNotificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdRef.current,
      ).catch(debugError);
    }

    if (seconds > 0) {
      const newId = `rest_timer_${Date.now()}`;
      currentNotificationIdRef.current = newId;

      await Notifications.scheduleNotificationAsync({
        identifier: newId,
        content: {
          title: t(
            "activeWorkout.notificationTitle",
            "¡Descanso terminado! 🏋️‍♂️",
          ),
          body: t(
            "activeWorkout.notificationBody",
            "Es hora de tu siguiente serie. ¡A darle!",
          ),
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          seconds: seconds,
          channelId: "rest-timer",
        },
      });
    }
  };

  // Carga del estado guardado al abrir la app
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
            const secondsPassed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            const newRestTime = parsedState.restTimeRemaining - secondsPassed;
            if (newRestTime > 0) {
              setRestTimeRemaining(newRestTime);
              scheduleRestNotification(newRestTime);
            } else {
              setRestTimeRemaining(0);
              setIsResting(false);
              if (currentNotificationIdRef.current) {
                Notifications.cancelScheduledNotificationAsync(
                  currentNotificationIdRef.current,
                );
              }
            }
          }

          if (parsedState.lastSavedTime && !parsedState.isPaused) {
            const secondsPassed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            setElapsedSeconds((prev) => prev + secondsPassed);
          }
        }
      } catch (e) {
        debugLog("Error cargando entrenamiento", e);
      } finally {
        lastTickRef.current = Date.now();
        setIsLoaded(true);
      }
    };
    loadSavedWorkout();
  }, []);

  const isWorkoutActive = !!activeRoutine;

  // Sincronización cuando la app regresa del segundo plano o se enciende la pantalla
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && isWorkoutActive) {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);

        if (deltaSeconds > 0 && !isPausedRef.current) {
          lastTickRef.current += deltaSeconds * 1000;
          setElapsedSeconds((prev) => prev + deltaSeconds);

          if (isRestingRef.current && restTimeRemainingRef.current !== null) {
            setRestTimeRemaining((prev) => {
              if (prev === null) return null;
              const newRest = prev - deltaSeconds;
              return newRest > 0 ? newRest : 0;
            });
          }
        }
      }
    });

    return () => subscription.remove();
  }, [isWorkoutActive]);

  // Reloj Maestro Autocorrectivo
  useEffect(() => {
    if (!isWorkoutActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);

      if (deltaSeconds >= 1) {
        lastTickRef.current += deltaSeconds * 1000;

        if (!isPausedRef.current) {
          setElapsedSeconds((prev) => prev + deltaSeconds);

          if (isRestingRef.current && restTimeRemainingRef.current !== null) {
            setRestTimeRemaining((prev) => {
              if (prev === null) return null;
              const newRest = prev - deltaSeconds;
              return newRest > 0 ? newRest : 0;
            });
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Sonido de la app
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
      debugLog("Error de sonido mp3", error);
    }
  };

  // Cuando el descanso llega a 0, se detiene y suena el MP3 personalizado
  useEffect(() => {
    if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
      setRestTimeRemaining(null);

      if (AppState.currentState === "active") {
        playTimerEndSound();
      }
    }
  }, [isResting, restTimeRemaining]);

  // Guardado Automático Local
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

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(JSON.parse(JSON.stringify(routine)));
    setOriginalRoutine(JSON.parse(JSON.stringify(routine)));
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
    lastTickRef.current = Date.now();
    if (currentNotificationIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdRef.current,
      );
    }
  };

  const cancelWorkout = async () => {
    setActiveRoutine(null);
    setOriginalRoutine(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    setRestTimeRemaining(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (currentNotificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdRef.current,
      );
    }
  };

  const finishWorkout = async () => {
    if (!activeRoutine || !user?.id) {
      cancelWorkout();
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        "Sin conexión",
        "Tu entrenamiento está a salvo localmente, pero necesitas internet para guardarlo.",
      );
      setIsPaused(true);
      return;
    }

    try {
      const completedExercises = activeRoutine.exercises
        .map((ex) => ({
          ...ex,
          sets: ex.sets.filter((set) => set.completed),
        }))
        .filter((ex) => ex.sets.length > 0);

      if (completedExercises.length === 0) {
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

      if (error) throw error;
    } catch (error) {
      debugError("Error al guardar el entrenamiento:", error);
    } finally {
      cancelWorkout();
    }
  };

  const resumeWorkout = () => {
    setIsPaused(false);
    if (isRestingRef.current && restTimeRemainingRef.current) {
      scheduleRestNotification(restTimeRemainingRef.current);
    }
  };

  const pauseWorkout = () => {
    setIsPaused(true);
    if (currentNotificationIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdRef.current,
      );
    }
  };

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
          id: Math.random().toString(36).substring(2, 9),
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
      scheduleRestNotification(defaultRestSeconds);
    }
  };

  const adjustRestTime = (secondsToAdd: number) => {
    if (restTimeRemainingRef.current === null) return;

    const newTime = Math.max(0, restTimeRemainingRef.current + secondsToAdd);

    restTimeRemainingRef.current = newTime;
    setRestTimeRemaining(newTime);

    if (newTime <= 0) {
      restTimeRemainingRef.current = null;
      isRestingRef.current = false;
      setIsResting(false);
      setRestTimeRemaining(null);

      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (currentNotificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(
          currentNotificationIdRef.current,
        ).catch(debugError);
      }

      if (AppState.currentState === "active") {
        playTimerEndSound();
      }
      return;
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      scheduleRestNotification(newTime);
    }, 500);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestTimeRemaining(null);
    restTimeRemainingRef.current = null;
    isRestingRef.current = false;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (currentNotificationIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdRef.current,
      ).catch(debugError);
    }
  };

  const updateExerciseRestTime = (exId: string, newTime: number) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) =>
      ex.id === exId ? { ...ex, restTimeSeconds: newTime } : ex,
    );
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const addExercisesToActiveRoutine = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({
      ...activeRoutine,
      exercises: [...activeRoutine.exercises, ...newExercises],
    });
  };

  const removeExerciseFromActiveRoutine = (exId: string) => {
    if (!activeRoutine) return;
    setActiveRoutine({
      ...activeRoutine,
      exercises: activeRoutine.exercises.filter((ex) => ex.id !== exId),
    });
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
        addExercisesToActiveRoutine,
        removeExerciseFromActiveRoutine,
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

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Audio } from "expo-av";
import * as Linking from "expo-linking";
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
import { lightColors } from "../constants/theme";
import { useAuth } from "./AuthContext";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

notifee.registerForegroundService((notification) => {
  return new Promise(() => {});
});

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
const REST_BEEP_ID = "rest_timer_beep";
const FOREGROUND_ID = "rest_timer_ongoing";

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
  const lastTickRef = useRef<number>(Date.now());
  const restEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  useEffect(() => {
    const setupSystem = async () => {
      await notifee.requestPermission();

      if (Platform.OS === "android") {
        await notifee.createChannel({
          id: "rest-timer",
          name: t("activeWorkout.restTimer"),
          importance: AndroidImportance.HIGH,
          vibration: true,
          vibrationPattern: [0, 500, 250, 500],
          lights: true,
          lightColor: lightColors.primary,
        });
      }

      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    setupSystem();
  }, []);

  const scheduleRestNotification = async (endTimestampMs: number) => {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(FOREGROUND_ID);

      const remainingMs = endTimestampMs - Date.now();
      if (remainingMs <= 0) return;

      await notifee.displayNotification({
        id: FOREGROUND_ID,
        title: t("activeWorkout.trainingLabel"),
        body: t("activeWorkout.restTimer"),
        android: {
          channelId: "rest-timer",
          asForegroundService: true,
          ongoing: true,
          color: lightColors.primary,
          smallIcon: "notification_icon",
          showChronometer: true,
          chronometerDirection: "down",
          timestamp: endTimestampMs,
          visibility: AndroidVisibility.PUBLIC,
          pressAction: {
            id: "default",
          },
        },
      });

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: endTimestampMs,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: REST_BEEP_ID,
          title: t("activeWorkout.notificationTitle"),
          body: t("activeWorkout.notificationBody"),
          android: {
            channelId: "rest-timer",
            importance: AndroidImportance.HIGH,
            smallIcon: "notification_icon",
            color: lightColors.primary,
            pressAction: {
              id: "default",
            },
          },
        },
        trigger,
      );
    } catch (error) {
      debugError("Fallo al programar Notifee:", error);
      if (Platform.OS === "android") {
        Alert.alert(t("alerts.exactAlarmTitle"), t("alerts.exactAlarmMsg"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.settings"),
            style: "default",
            onPress: () => Linking.openSettings(),
          },
        ]);
      }
    }
  };

  const stopRestNotifications = async () => {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(FOREGROUND_ID);
    } catch (e) {
      debugLog("Error cancelando notificaciones", e);
    }
  };

  useEffect(() => {
    const loadSavedWorkout = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setActiveRoutine(parsedState.activeRoutine);
          setOriginalRoutine(parsedState.originalRoutine);
          setIsPaused(parsedState.isPaused);

          if (parsedState.lastSavedTime && !parsedState.isPaused) {
            const secondsPassed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            setElapsedSeconds(
              (parsedState.elapsedSeconds || 0) + secondsPassed,
            );
          } else {
            setElapsedSeconds(parsedState.elapsedSeconds || 0);
          }

          if (parsedState.restEndTime) {
            restEndTimeRef.current = parsedState.restEndTime;
            const remaining = Math.ceil(
              (parsedState.restEndTime - Date.now()) / 1000,
            );

            if (remaining > 0) {
              setIsResting(true);
              isRestingRef.current = true;
              setRestTimeRemaining(remaining);
              scheduleRestNotification(parsedState.restEndTime);
            } else {
              setIsResting(false);
              isRestingRef.current = false;
              setRestTimeRemaining(0);
              restEndTimeRef.current = null;
              stopRestNotifications();
            }
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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && isWorkoutActive) {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);

        if (deltaSeconds > 0 && !isPausedRef.current) {
          lastTickRef.current = now;
          setElapsedSeconds((prev) => prev + deltaSeconds);

          if (isRestingRef.current && restEndTimeRef.current !== null) {
            const remaining = Math.ceil((restEndTimeRef.current - now) / 1000);
            setRestTimeRemaining(Math.max(0, remaining));
          }
        }
      }
    });

    return () => subscription.remove();
  }, [isWorkoutActive]);

  useEffect(() => {
    if (!isWorkoutActive) return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);

      if (deltaSeconds >= 1) {
        lastTickRef.current += deltaSeconds * 1000;
        setElapsedSeconds((prev) => prev + deltaSeconds);
      }

      if (isRestingRef.current && restEndTimeRef.current !== null) {
        const remaining = Math.ceil((restEndTimeRef.current - now) / 1000);
        setRestTimeRemaining(Math.max(0, remaining));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  useEffect(() => {
    if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
      isRestingRef.current = false;
      setRestTimeRemaining(null);
      restEndTimeRef.current = null;

      stopRestNotifications();

      if (AppState.currentState === "active") {
        playTimerEndSound();
      }
    }
  }, [isResting, restTimeRemaining]);

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
          restEndTime: restEndTimeRef.current,
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

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(JSON.parse(JSON.stringify(routine)));
    setOriginalRoutine(JSON.parse(JSON.stringify(routine)));
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeRemaining(null);
    restEndTimeRef.current = null;
    lastTickRef.current = Date.now();
  };

  const cancelWorkout = async () => {
    setActiveRoutine(null);
    setOriginalRoutine(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeRemaining(null);
    restEndTimeRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    await stopRestNotifications();
    await notifee.cancelNotification(REST_BEEP_ID);
  };

  const finishWorkout = async () => {
    if (!activeRoutine || !user?.id) {
      cancelWorkout();
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(t("profile.alerts.error"), t("errors.networkFailed"));
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
      debugError("Error al guardar:", error);
    } finally {
      cancelWorkout();
    }
  };

  const resumeWorkout = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
    isPausedRef.current = false;
    if (isRestingRef.current && restEndTimeRef.current) {
      scheduleRestNotification(restEndTimeRef.current);
    }
  };

  const pauseWorkout = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    stopRestNotifications();
    notifee.cancelNotification(REST_BEEP_ID);
  };

  const reorderActiveExercises = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({ ...activeRoutine, exercises: newExercises });
  };

  const handleSetChange = (
    exId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => {
    if (!activeRoutine) return;
    const numValue = value === "" ? 0 : Number(value.replace(/[^0-9.]/g, ""));
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId) {
        const updatedSets = ex.sets.map((s) =>
          s.id === setId ? { ...s, [field]: numValue } : s,
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const changeExerciseUnit = (exId: string, newUnit: WeightUnit) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId) {
        const updatedSets = ex.sets.map((s) => ({ ...s, weightUnit: newUnit }));
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const addSetToExercise = (exId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId) {
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

  const removeSetFromExercise = (exId: string, setId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId)
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const toggleSetCompletion = (
    exId: string,
    setId: string,
    defaultRest: number,
  ) => {
    if (!activeRoutine) return;
    let isMarkingAsComplete = false;

    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId) {
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

    if (isMarkingAsComplete) {
      const endTimestamp = Date.now() + defaultRest * 1000;
      restEndTimeRef.current = endTimestamp;
      isRestingRef.current = true;
      setRestTimeRemaining(defaultRest);
      setIsResting(true);

      scheduleRestNotification(endTimestamp);
    }
  };

  const stopRestTimer = () => {
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeRemaining(null);
    restEndTimeRef.current = null;

    stopRestNotifications();
    notifee.cancelNotification(REST_BEEP_ID);
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

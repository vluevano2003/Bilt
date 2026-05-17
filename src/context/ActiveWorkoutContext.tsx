import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Audio } from "expo-av";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState, Vibration } from "react-native";
import BackgroundTimer from "react-native-background-timer";
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

/**
 * Nota importante sobre el Foreground Service:
 * React Native no puede mantener un proceso en segundo plano puro, por lo que usamos notifee para crear una notificación de servicio en primer plano.
 * Sin embargo, el código JavaScript se pausa cuando la app va a segundo plano, lo que significa que no podemos ejecutar lógica de temporizador o actualizaciones mientras la app no esté activa.
 * Para mitigar esto, guardamos el estado del entrenamiento en AsyncStorage cada vez que cambia y calculamos el tiempo transcurrido/restante basándonos en timestamps cuando la app vuelve a primer plano.
 * Esto no es perfecto (por ejemplo, si el usuario fuerza el cierre de la app, se perderá el estado), pero es una limitación de cómo funcionan las apps en segundo plano en React Native.
 * La notificación seguirá mostrando que el entrenamiento está activo, pero no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano.
 */
notifee.registerForegroundService((notification) => {
  return new Promise<void>((resolve) => {
    const unsubscribe = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.DISMISSED || type === EventType.APP_BLOCKED) {
        unsubscribe();
        resolve();
      }
    });
  });
});

interface ActiveWorkoutContextProps {
  activeRoutine: Routine | null;
  originalRoutine: Routine | null;
  elapsedSeconds: number;
  isPaused: boolean;
  restTimeRemaining: number | null;
  isResting: boolean;
  isLoaded: boolean;
  isStarting: boolean;
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
  adjustRestTime: (seconds: number) => void;
  reorderActiveExercises: (newExercises: RoutineExercise[]) => void;
  setIsPaused: (val: boolean) => void;
  updateExerciseRestTime: (exId: string, newTime: number) => void;
  addExercisesToActiveRoutine: (newExercises: RoutineExercise[]) => void;
  removeExerciseFromActiveRoutine: (exId: string) => void;
}

export const ActiveWorkoutContext =
  createContext<ActiveWorkoutContextProps | null>(null);

const STORAGE_KEY = "active_workout_state";
const WORKOUT_CHANNEL_ID = "workout_status_channel";
const NOTIFICATION_ID = "workout_status_alert";

/**
 * ActiveWorkoutProvider es el corazón de la funcionalidad de entrenamiento activo. Maneja el estado del entrenamiento en curso, incluyendo la rutina activa, el tiempo transcurrido, el estado de pausa, y los temporizadores de descanso. También se encarga de mostrar notificaciones persistentes mientras el entrenamiento está activo, incluso cuando la app está en segundo plano.
 * @param param0
 * @returns
 */
export const ActiveWorkoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useAuth();
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
  const [isStarting, setIsStarting] = useState(false);
  const [currentAppState, setCurrentAppState] = useState(AppState.currentState);

  const isPausedRef = useRef(isPaused);
  const isRestingRef = useRef(isResting);
  const lastTickRef = useRef<number>(Date.now());
  const restEndTimeRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef(0);
  const beepSoundRef = useRef<Audio.Sound | null>(null);

  const latestStateRef = useRef({
    activeRoutine,
    originalRoutine,
    elapsedSeconds,
    isPaused,
    restTimeRemaining,
    isResting,
  });

  // Mantenemos refs para isPaused e isResting para que las funciones de temporizador puedan acceder al estado más reciente incluso cuando el código JS está pausado en segundo plano.
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Lo mismo para isResting, aunque en la práctica no podremos actualizar el temporizador de descanso en segundo plano, esto asegura que si el usuario pausa o reanuda el entrenamiento mientras está en segundo plano, el estado se refleje correctamente cuando vuelva a primer plano.
  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  useEffect(() => {
    latestStateRef.current = {
      activeRoutine,
      originalRoutine,
      elapsedSeconds,
      isPaused,
      restTimeRemaining,
      isResting,
    };
  }, [
    activeRoutine,
    originalRoutine,
    elapsedSeconds,
    isPaused,
    restTimeRemaining,
    isResting,
  ]);

  // Al montar el proveedor, configuramos el sistema de audio.
  useEffect(() => {
    let isMounted = true;
    const setupSystem = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });

        await notifee.createChannel({
          id: WORKOUT_CHANNEL_ID,
          name: t("activeWorkout.notificationChannelName"),
          importance: AndroidImportance.HIGH,
          sound: "default",
        });

        const { sound: beep } = await Audio.Sound.createAsync(
          require("../../assets/sounds/beep.mp3"),
          { shouldPlay: false, volume: 1.0 },
        );

        if (isMounted) {
          beepSoundRef.current = beep;
        }
      } catch (e) {
        debugError("Error inicializando sistema de audio:", e);
      }
    };
    setupSystem();

    return () => {
      isMounted = false;
      if (beepSoundRef.current) beepSoundRef.current.unloadAsync();
    };
  }, [t]);

  /**
   * Formatea un número de segundos en una cadena de formato "M:SS" para mostrar el tiempo restante del descanso en la notificación.
   * @param seconds
   * @returns
   */
  const formatRestTimeStr = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /**
   * Muestra una notificación persistente que indica que el entrenamiento está activo.
   * @param routineName
   * @param currentElapsedSeconds
   */
  const showActiveWorkoutNotification = async (
    routineName: string | undefined,
    currentElapsedSeconds: number = 0,
  ) => {
    try {
      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: t("activeWorkout.notificationActiveTitle"),
        body: routineName || t("activeWorkout.notificationActiveBody"),
        android: {
          channelId: WORKOUT_CHANNEL_ID,
          asForegroundService: true,
          color: "#CC5500",
          ongoing: true,
          onlyAlertOnce: true,
          smallIcon: "notification_icon",
          showChronometer: true,
          timestamp: Date.now() - currentElapsedSeconds * 1000,
        },
      });
    } catch (error) {
      debugError("Fallo al iniciar Foreground Service activo:", error);
    }
  };

  /**
   * Actualiza la notificación de descanso con el tiempo restante.
   * @param remainingSeconds
   */
  const updateRestNotification = async (remainingSeconds: number) => {
    try {
      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: t("activeWorkout.restInProgress"),
        body: t("activeWorkout.restInProgressBody", "Descansando..."),
        android: {
          channelId: WORKOUT_CHANNEL_ID,
          asForegroundService: true,
          color: "#CC5500",
          ongoing: true,
          onlyAlertOnce: true,
          smallIcon: "notification_icon",
          showChronometer: true,
          chronometerDirection: "down",
          timestamp: Date.now() + remainingSeconds * 1000,
        },
      });
    } catch (e) {}
  };

  /**
   * Detiene el servicio en primer plano y cancela la notificación. Esto se llama cuando el entrenamiento se pausa o se cancela.
   */
  const stopAllNotifications = async () => {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(NOTIFICATION_ID);
    } catch (e) {
      debugLog("Error cancelando notificaciones", e);
    }
  };

  /**
   * Reproduce un sonido de timbre cuando el temporizador de descanso llega a 0.
   */
  const playTimerEndSound = async () => {
    try {
      Vibration.vibrate([0, 500, 250, 500]);
      if (beepSoundRef.current) {
        await beepSoundRef.current.replayAsync().catch(() => {});
      }
    } catch (error) {
      debugLog("Error reproduciendo sonido", error);
    }
  };

  /**
   * Ajusta dinámicamente el tiempo de descanso sumando o restando segundos sin romper el Beep programado.
   * @param seconds Segundos a añadir (positivo) o restar (negativo)
   */
  const adjustRestTime = (seconds: number) => {
    if (
      !isRestingRef.current ||
      restEndTimeRef.current === null ||
      restTimeRemaining === null
    )
      return;

    const now = Date.now();
    const newEndTime = restEndTimeRef.current + seconds * 1000;

    if (newEndTime <= now) {
      stopRestTimer();
      return;
    }

    restEndTimeRef.current = newEndTime;
    const newRemaining = Math.ceil((newEndTime - now) / 1000);

    if (AppState.currentState === "active") {
      setRestTimeRemaining(newRemaining);
    }

    updateRestNotification(newRemaining);
  };

  // Al cargar el proveedor, intentamos restaurar el estado del entrenamiento desde AsyncStorage.
  useEffect(() => {
    const loadSavedWorkout = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setActiveRoutine(parsedState.activeRoutine);
          setOriginalRoutine(parsedState.originalRoutine);
          setIsPaused(parsedState.isPaused);

          let currentElapsed = parsedState.elapsedSeconds || 0;

          if (parsedState.lastSavedTime && !parsedState.isPaused) {
            const secondsPassed = Math.floor(
              (Date.now() - parsedState.lastSavedTime) / 1000,
            );
            currentElapsed += secondsPassed;
            setElapsedSeconds(currentElapsed);
            elapsedSecondsRef.current = currentElapsed;
          } else {
            setElapsedSeconds(currentElapsed);
            elapsedSecondsRef.current = currentElapsed;
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
              updateRestNotification(remaining);
            } else {
              setIsResting(false);
              isRestingRef.current = false;
              setRestTimeRemaining(0);
              restEndTimeRef.current = null;
              showActiveWorkoutNotification(
                parsedState.activeRoutine?.name,
                currentElapsed,
              );
            }
          } else {
            showActiveWorkoutNotification(
              parsedState.activeRoutine?.name,
              currentElapsed,
            );
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

  // Configuramos un listener para detectar cuando la app vuelve a primer plano.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setCurrentAppState(nextAppState);

      if (nextAppState === "active" && isWorkoutActive) {
        setElapsedSeconds(elapsedSecondsRef.current);

        if (isRestingRef.current && restEndTimeRef.current !== null) {
          const remaining = Math.ceil(
            (restEndTimeRef.current - Date.now()) / 1000,
          );
          if (remaining > 0) {
            setRestTimeRemaining(remaining);
            setIsResting(true);
          } else {
            setRestTimeRemaining(null);
            setIsResting(false);
          }
        } else {
          setRestTimeRemaining(null);
          setIsResting(false);
        }
      } else if (
        (nextAppState === "background" || nextAppState === "inactive") &&
        isWorkoutActive
      ) {
        const state = latestStateRef.current;
        const stateToSave = {
          ...state,
          elapsedSeconds: elapsedSecondsRef.current,
          restEndTime: restEndTimeRef.current,
          lastSavedTime: Date.now(),
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)).catch(
          (err) => debugError("Error guardando en background", err),
        );
      }
    });

    return () => subscription.remove();
  }, [isWorkoutActive]);

  // Configuramos un temporizador que se ejecuta cada segundo para actualizar el tiempo transcurrido y el tiempo de descanso restante. Este temporizador seguirá funcionando incluso cuando la app esté en segundo plano gracias a BackgroundTimer, pero como el código JS se pausa, usamos timestamps para calcular el tiempo transcurrido/restante en lugar de confiar en setInterval para contar los segundos.
  useEffect(() => {
    if (!isWorkoutActive) return;

    const intervalId = BackgroundTimer.setInterval(() => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const isActive = AppState.currentState === "active";

      const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);
      if (deltaSeconds >= 1) {
        lastTickRef.current += deltaSeconds * 1000;

        elapsedSecondsRef.current += deltaSeconds;

        if (isActive) {
          setElapsedSeconds(elapsedSecondsRef.current);
        }
      }

      if (isRestingRef.current && restEndTimeRef.current !== null) {
        const remaining = Math.ceil((restEndTimeRef.current - now) / 1000);

        if (remaining <= 0) {
          isRestingRef.current = false;
          restEndTimeRef.current = null;

          if (isActive) {
            setRestTimeRemaining(null);
            setIsResting(false);
          }

          playTimerEndSound();

          const state = latestStateRef.current;
          showActiveWorkoutNotification(
            state.activeRoutine?.name,
            elapsedSecondsRef.current,
          );
        } else {
          if (isActive) {
            setRestTimeRemaining(remaining);
            setIsResting(true);
          }
        }
      }
    }, 1000);

    return () => BackgroundTimer.clearInterval(intervalId);
  }, [isWorkoutActive]);

  // Cada vez que el estado del entrenamiento cambia, lo guardamos en AsyncStorage.
  useEffect(() => {
    if (!isLoaded) return;
    const saveWorkoutState = async () => {
      if (activeRoutine) {
        const state = latestStateRef.current;
        const stateToSave = {
          ...state,
          elapsedSeconds: elapsedSecondsRef.current,
          restEndTime: restEndTimeRef.current,
          lastSavedTime: Date.now(),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    };
    saveWorkoutState();
  }, [activeRoutine, isPaused, isResting, isLoaded]);

  /**
   * Inicia un nuevo entrenamiento con la rutina seleccionada.
   * @param routine
   */
  const startWorkout = async (routine: Routine) => {
    setIsStarting(true);

    try {
      await notifee.requestPermission();

      try {
        const batteryOptimizationEnabled =
          await notifee.isBatteryOptimizationEnabled();
        if (batteryOptimizationEnabled) {
          Alert.alert(
            t("activeWorkout.batteryAlertTitle"),
            t("activeWorkout.batteryAlertMsg"),
            [
              { text: t("common.ignore"), style: "cancel" },
              {
                text: t("common.config"),
                onPress: async () =>
                  await notifee.openBatteryOptimizationSettings(),
              },
            ],
          );
        }
      } catch (error) {
        debugLog("No se pudo revisar el estado de la batería", error);
      }

      const workoutToStart = JSON.parse(JSON.stringify(routine));

      workoutToStart.exercises.forEach((ex: any) => {
        ex.sets.forEach((s: any) => {
          s.weight = 0;
          s.reps = 0;
          s.completed = false;
        });
      });

      setActiveRoutine(workoutToStart);
      setOriginalRoutine(JSON.parse(JSON.stringify(routine)));
      setElapsedSeconds(0);
      elapsedSecondsRef.current = 0;
      setIsPaused(false);
      setIsResting(false);
      isRestingRef.current = false;
      setRestTimeRemaining(null);
      restEndTimeRef.current = null;
      lastTickRef.current = Date.now();
      showActiveWorkoutNotification(routine.name, 0);
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Detiene el entrenamiento activo, resetea el estado y cancela la notificación persistente.
   */
  const cancelWorkout = async () => {
    setActiveRoutine(null);
    setOriginalRoutine(null);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setIsPaused(false);
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeRemaining(null);
    restEndTimeRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    await stopAllNotifications();
  };

  // Si el usuario cierra sesión mientras un entrenamiento está activo, cancelamos el entrenamiento.
  useEffect(() => {
    if (!isLoading && !user && activeRoutine) {
      cancelWorkout();
    }
  }, [user, isLoading, activeRoutine]);

  /**
   * Finaliza el entrenamiento activo, guarda el historial y cancela la notificación persistente.
   * @returns
   */
  const finishWorkout = async () => {
    if (!activeRoutine || !user?.id) {
      cancelWorkout();
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(t("profile.alerts.error"), t("errors.networkFailed"));
      setIsPaused(true);
      throw new Error(t("errors.networkFailed"));
    }

    try {
      const completedExercises = activeRoutine.exercises
        .map((ex) => ({
          ...ex,
          sets: ex.sets.filter((set) => set.completed),
        }))
        .filter((ex) => ex.sets.length > 0);

      if (completedExercises.length > 0) {
        const insertPromise = supabase.from("history").insert([
          {
            user_id: user.id,
            routine_id: activeRoutine.id,
            routine_name: activeRoutine.name,
            duration_seconds: elapsedSecondsRef.current,
            exercises: completedExercises,
          },
        ]);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(t("errors.timeout"))), 8000),
        );

        const response = (await Promise.race([
          insertPromise,
          timeoutPromise,
        ])) as any;

        if (response && response.error) throw response.error;
      }

      setIsResting(false);
      isRestingRef.current = false;
      setRestTimeRemaining(null);
      restEndTimeRef.current = null;
      await stopAllNotifications();
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      debugError("Error al guardar:", error);
      Alert.alert(t("profile.alerts.error"), t("errors.networkFailed"));
      throw error;
    }
  };

  /**
   * Reanuda el entrenamiento después de una pausa.
   */
  const resumeWorkout = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
    isPausedRef.current = false;
    if (isRestingRef.current && restEndTimeRef.current) {
      const remaining = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
      updateRestNotification(remaining);
    } else {
      showActiveWorkoutNotification(
        activeRoutine?.name,
        elapsedSecondsRef.current,
      );
    }
  };

  /**
   * Pausa el entrenamiento activo.
   */
  const pauseWorkout = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    stopAllNotifications();
  };

  /**
   * Reordena los ejercicios en la rutina activa.
   * @param newExercises
   * @returns
   */
  const reorderActiveExercises = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({ ...activeRoutine, exercises: newExercises });
  };

  /**
   * Actualiza el peso o las repeticiones de un set específico en un ejercicio.
   * @param exId
   * @param setId
   * @param field
   * @param val
   * @returns
   */
  const handleSetChange = (
    exId: string,
    setId: string,
    field: "weight" | "reps",
    val: string,
  ) => {
    if (!activeRoutine) return;
    const numValue = val === "" ? 0 : Number(val.replace(/[^0-9.]/g, ""));
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

  /**
   * Cambia la unidad de peso de todos los sets de un ejercicio específico.
   * @param exId
   * @param newUnit
   * @returns
   */
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

  /**
   * Agrega un nuevo set a un ejercicio específico.
   * @param exId
   * @returns
   */
  const addSetToExercise = (exId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: Math.random().toString(36).substring(2, 9),
          type: "normal",
          reps: 0,
          weight: 0,
          weightUnit: lastSet ? lastSet.weightUnit : "kg",
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  /**
   * Elimina un set específico de un ejercicio.
   * @param exId
   * @param setId
   * @returns
   */
  const removeSetFromExercise = (exId: string, setId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exId)
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  /**
   * Marca un set como completado o no completado. Si se marca como completado, inicia el temporizador de descanso.
   * @param exId
   * @param setId
   * @param defaultRest
   * @returns
   */
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
      setIsResting(true);
      setRestTimeRemaining(defaultRest);

      updateRestNotification(defaultRest);
    }
  };

  /**
   * Detiene el temporizador de descanso y vuelve al estado normal de entrenamiento activo.
   */
  const stopRestTimer = async () => {
    isRestingRef.current = false;
    restEndTimeRef.current = null;
    setIsResting(false);
    setRestTimeRemaining(null);

    showActiveWorkoutNotification(
      activeRoutine?.name,
      elapsedSecondsRef.current,
    );
  };

  /**
   * Actualiza el tiempo de descanso de un ejercicio específico.
   * @param exId
   * @param newTime
   * @returns
   */
  const updateExerciseRestTime = (exId: string, newTime: number) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) =>
      ex.id === exId ? { ...ex, restTimeSeconds: newTime } : ex,
    );
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  /**
   * Agrega nuevos ejercicios a la rutina activa.
   * @param newExercises
   * @returns
   */
  const addExercisesToActiveRoutine = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({
      ...activeRoutine,
      exercises: [...activeRoutine.exercises, ...newExercises],
    });
  };

  /**
   * Elimina un ejercicio específico de la rutina activa.
   * @param exId
   * @returns
   */
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

import notifee, {
  AndroidImportance,
  EventType,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState } from "react-native";
import {
  ExerciseSet,
  Routine,
  RoutineExercise,
  SetType,
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
let isForegroundServiceRunning = false;

/**
 * Nota importante sobre el Foreground Service:
 * React Native no puede mantener un proceso en segundo plano puro, por lo que usamos notifee para crear una notificación de servicio en primer plano.
 * Sin embargo, el código JavaScript se pausa cuando la app va a segundo plano, lo que significa que no podemos ejecutar lógica de temporizador o actualizaciones mientras la app no esté activa.
 * Para mitigar esto, guardamos el estado del entrenamiento en AsyncStorage cada vez que cambia y calculamos el tiempo transcurrido/restante basándonos en timestamps cuando la app vuelve a primer plano.
 * Esto no es perfecto (por ejemplo, si el usuario fuerza el cierre de la app, se perderá el estado), pero es una limitación de cómo funcionan las apps en segundo plano en React Native.
 *
 * SOBRE EL BEEP CON PANTALLA APAGADA:
 * Android activa Doze Mode cuando la pantalla se apaga, lo que congela o throttlea los setTimeout/setInterval de JS.
 * Por eso se usa notifee.createTriggerNotification con TimestampTrigger para el beep: esto schedula la alarma
 * directamente en el sistema Android (AlarmManager con setExactAndAllowWhileIdle), que sí se respeta
 * aunque el proceso JS esté congelado. Esto garantiza que el beep suene a tiempo incluso con pantalla apagada.
 */
notifee.registerForegroundService((notification) => {
  return new Promise<void>((resolve) => {
    isForegroundServiceRunning = true;
    const unsubscribe = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.DISMISSED || type === EventType.APP_BLOCKED) {
        isForegroundServiceRunning = false;
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
  finishWorkout: (measurementSystem?: string, userWeightString?: string) => Promise<void>;
  handleSetChange: (
    exId: string,
    setId: string,
    field: "weight" | "reps",
    val: string,
  ) => void;
  changeExerciseUnit: (exId: string, newUnit: WeightUnit) => void;
  changeSetType: (exId: string, setId: string, newType: SetType) => void;
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
const ALARM_CHANNEL_ID = "rest_alarm_channel_v8";
const NOTIFICATION_ID = "workout_status_alert";
const BEEP_NOTIFICATION_ID = "rest_beep_alarm";
const NOTIFICATION_THROTTLE_MS = 1000;

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

  const isPausedRef = useRef(isPaused);
  const isRestingRef = useRef(isResting);
  const lastTickRef = useRef<number>(Date.now());
  const restEndTimeRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef(0);
  const restTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restResolveTokenRef = useRef<number>(0);
  const lastNotifUpdateRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

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

  // Al montar el proveedor, configuramos el sistema de audio para permitir la reproducción en segundo plano y creamos un canal de notificaciones para el entrenamiento activo.
  useEffect(() => {
    const setupSystem = async () => {
      try {
        await notifee.createChannel({
          id: WORKOUT_CHANNEL_ID,
          name: t("activeWorkout.notificationChannelName"),
          importance: AndroidImportance.LOW,
        });

        await notifee.createChannel({
          id: ALARM_CHANNEL_ID,
          name: t("activeWorkout.restTimer"),
          importance: AndroidImportance.HIGH,
          sound: "beep",
          vibration: true,
          vibrationPattern: [300, 500, 250, 500],
        });
      } catch (e) {
        debugError("Error inicializando canales de notifee:", e);
      }
    };
    setupSystem();
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
   * Muestra o actualiza la notificación persistente del entrenamiento activo. Esta función se llama al iniciar un entrenamiento, al actualizar el tiempo transcurrido, y al volver a primer plano. Debido a las limitaciones de React Native en segundo plano, esta notificación no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param routineName
   * @param currentElapsedSeconds
   * @param force Omite el throttle y la verificación de transición
   */
  const showActiveWorkoutNotification = async (
    routineName: string | undefined,
    currentElapsedSeconds: number = 0,
    force = false,
  ) => {
    if (!force && isTransitioningRef.current) return;

    const now = Date.now();
    if (!force && now - lastNotifUpdateRef.current < NOTIFICATION_THROTTLE_MS) {
      return;
    }
    lastNotifUpdateRef.current = now;

    try {
      const canStartForeground =
        AppState.currentState === "active" || isForegroundServiceRunning;

      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: t("activeWorkout.notificationActiveTitle"),
        body: routineName || t("activeWorkout.notificationActiveBody"),
        android: {
          channelId: WORKOUT_CHANNEL_ID,
          asForegroundService: canStartForeground,
          foregroundServiceTypes: [1 as any],
          color: "#CC5500",
          ongoing: true,
          onlyAlertOnce: true,
          smallIcon: "notification_icon",
          pressAction: {
            id: "default",
          },
        },
      });

      if (canStartForeground) {
        isForegroundServiceRunning = true;
      }
    } catch (error) {
      debugError("Fallo al iniciar Foreground Service activo:", error);
    }
  };

  /**
   * Muestra o actualiza la notificación de descanso en curso. Esta función se llama al iniciar un descanso y cada vez que se actualiza el tiempo restante del descanso. Debido a las limitaciones de React Native en segundo plano, esta notificación no podrá actualizar dinámicamente el tiempo restante del descanso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param remainingSeconds
   * @param force Omite el throttle
   */
  const updateRestNotification = async (
    remainingSeconds: number,
    force = false,
  ) => {
    const now = Date.now();
    if (!force && now - lastNotifUpdateRef.current < NOTIFICATION_THROTTLE_MS) {
      return;
    }
    lastNotifUpdateRef.current = now;

    try {
      const canStartForeground =
        AppState.currentState === "active" || isForegroundServiceRunning;

      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: t("activeWorkout.restInProgress"),
        body: t("activeWorkout.restInProgressBody"),
        android: {
          channelId: WORKOUT_CHANNEL_ID,
          asForegroundService: canStartForeground,
          foregroundServiceTypes: [1 as any],
          color: "#CC5500",
          ongoing: true,
          onlyAlertOnce: true,
          smallIcon: "notification_icon",
          pressAction: {
            id: "default",
          },
        },
      });

      if (canStartForeground) {
        isForegroundServiceRunning = true;
      }
    } catch (e) {
      debugError("Fallo al actualizar Foreground Service de descanso:", e);
    }
  };

  /**
   * Limpia el temporizador de JavaScript de detección de fin de descanso.
   */
  const clearRestTimeout = () => {
    if (restTimeoutRef.current) {
      clearTimeout(restTimeoutRef.current);
      restTimeoutRef.current = null;
    }
  };

  /**
   * Cancela la trigger notification del beep, tanto si está pendiente (en el AlarmManager)
   * como si ya fue mostrada (visible en la bandeja de notificaciones).
   * Usar cancelTriggerNotification evita que suene si el usuario omite el descanso antes de tiempo.
   */
  const cancelBeepNotification = async () => {
    try {
      await notifee.cancelTriggerNotification(BEEP_NOTIFICATION_ID);
    } catch (_) {}
    try {
      await notifee.cancelNotification(BEEP_NOTIFICATION_ID);
    } catch (_) {}
  };

  /**
   * Cancela todos los mecanismos de alarma del descanso:
   * el timeout de JS (fallback en primer plano), la trigger notification del sistema,
   * y el token de resolución para descartar invocaciones pendientes de handleRestFinished.
   */
  const cancelRestAlarm = () => {
    clearRestTimeout();
    restResolveTokenRef.current += 1;
    cancelBeepNotification().catch(() => {});
  };

  /**
   * Maneja la finalización del descanso, ya sea porque el usuario decidió omitirlo o porque se detectó que el tiempo de descanso ha terminado. Esta función actualiza el estado para reflejar que el descanso ha terminado, muestra un beep de notificación y luego restaura la notificación persistente del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param resolveToken
   * @returns
   */
  const handleRestFinished = (resolveToken: number) => {
    if (resolveToken !== restResolveTokenRef.current) return;

    restResolveTokenRef.current += 1;

    isTransitioningRef.current = true;

    isRestingRef.current = false;
    restEndTimeRef.current = null;
    clearRestTimeout();

    setRestTimeRemaining(null);
    setIsResting(false);

    setTimeout(() => {
      if (isRestingRef.current) return;

      isTransitioningRef.current = false;
      lastNotifUpdateRef.current = Date.now();

      const state = latestStateRef.current;
      showActiveWorkoutNotification(
        state.activeRoutine?.name,
        elapsedSecondsRef.current,
        true,
      ).catch(debugError);
    }, 1200);
  };

  /**
   * Programa una alarma para el final del descanso usando setTimeout. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native. Si la app va a segundo plano, el temporizador se pausará y no se reanudará hasta que la app vuelva a primer plano, momento en el cual se recalculará el tiempo restante del descanso basándose en timestamps para determinar si el descanso ha terminado o cuánto tiempo queda.
   * @param endTimestamp
   */
  const scheduleRestAlarm = async (endTimestamp: number) => {
    clearRestTimeout();

    restResolveTokenRef.current += 1;
    const token = restResolveTokenRef.current;

    const delayMs = endTimestamp - Date.now();

    if (delayMs <= 0) {
      handleRestFinished(token);
      return;
    }

    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: endTimestamp,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: BEEP_NOTIFICATION_ID,
          title: t("activeWorkout.notificationTitle"),
          body: t("activeWorkout.notificationBody"),
          android: {
            channelId: ALARM_CHANNEL_ID,
            pressAction: { id: "default" },
            importance: AndroidImportance.HIGH,
            autoCancel: true,
            timeoutAfter: 6000,
          },
        },
        trigger,
      );
    } catch (e) {
      debugError("Error programando trigger notification del beep:", e);
    }

    restTimeoutRef.current = setTimeout(() => {
      handleRestFinished(token);
    }, delayMs);
  };

  /**
   * Detiene el foreground service y cancela todas las notificaciones activas.
   * Esto se llama al pausar, cancelar o finalizar el entrenamiento.
   */
  const stopAllNotifications = async () => {
    try {
      isForegroundServiceRunning = false;
      await notifee.stopForegroundService();
      await notifee.cancelNotification(NOTIFICATION_ID);
      cancelRestAlarm();
    } catch (e) {
      debugLog("Error cancelando notificaciones", e);
    }
  };

  /**
   * Ajusta el tiempo restante del descanso sumando o restando segundos. Esto se llama cuando el usuario edita el tiempo de descanso en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos ajustar el tiempo restante del descanso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param seconds
   * @returns
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

    updateRestNotification(newRemaining, true);
    scheduleRestAlarm(newEndTime);
  };

  // Al cargar el proveedor, intentamos restaurar el estado del entrenamiento desde AsyncStorage. Si encontramos un estado guardado, lo restauramos y calculamos el tiempo transcurrido/restante basándonos en timestamps para mitigar las limitaciones de React Native en segundo plano. Si no hay estado guardado, simplemente marcamos que la carga ha terminado.
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
              updateRestNotification(remaining, true);
              scheduleRestAlarm(parsedState.restEndTime);
            } else {
              setIsResting(false);
              isRestingRef.current = false;
              setRestTimeRemaining(0);
              restEndTimeRef.current = null;
              showActiveWorkoutNotification(
                parsedState.activeRoutine?.name,
                currentElapsed,
                true,
              );
            }
          } else {
            showActiveWorkoutNotification(
              parsedState.activeRoutine?.name,
              currentElapsed,
              true,
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

  // Configuramos un listener para detectar cuando la app vuelve a primer plano. Cuando esto sucede, calculamos el tiempo transcurrido desde el último tick y actualizamos el estado en consecuencia. Esto nos ayuda a mitigar las limitaciones de React Native en segundo plano, aunque no es perfecto (por ejemplo, si el usuario fuerza el cierre de la app, se perderá el estado).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
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
            const token = restResolveTokenRef.current;
            handleRestFinished(token);
          }
        } else if (!isRestingRef.current && !isTransitioningRef.current) {
          setRestTimeRemaining(null);
          setIsResting(false);
          isRestingRef.current = false;

          const state = latestStateRef.current;
          showActiveWorkoutNotification(
            state.activeRoutine?.name,
            elapsedSecondsRef.current,
            true,
          );
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

  // Configuramos un setInterval para actualizar el tiempo transcurrido y el tiempo restante del descanso cada segundo. Este intervalo solo se ejecuta cuando hay un entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, este intervalo se pausará automáticamente cuando la app vaya a segundo plano, lo que significa que no podremos actualizar el tiempo transcurrido ni el tiempo restante del descanso mientras la app no esté activa. Sin embargo, cuando la app vuelva a primer plano, el listener de AppState se encargará de calcular el tiempo transcurrido/restante basándose en timestamps para mantener el estado lo más actualizado posible.
  useEffect(() => {
    if (!isWorkoutActive) return;

    const intervalId = setInterval(() => {
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

        if (remaining > 0) {
          if (isActive) setRestTimeRemaining(remaining);
        } else {
          const token = restResolveTokenRef.current;
          handleRestFinished(token);
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isWorkoutActive]);

  // Cada vez que cambia el estado del entrenamiento activo, lo guardamos en AsyncStorage para mitigar las limitaciones de React Native en segundo plano. Esto se ejecuta cada vez que cambia activeRoutine, isPaused, isResting o isLoaded. Debido a las limitaciones de React Native en segundo plano, este guardado no garantiza que el estado se mantenga perfectamente sincronizado si la app está en segundo plano, pero ayuda a minimizar la pérdida de progreso en caso de que el usuario cierre la app o el sistema la termine por falta de recursos.
  useEffect(() => {
    if (!isLoaded) return;

    const debounceTimer = setTimeout(async () => {
      try {
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
      } catch (e) {
        debugError("Error guardando estado del entrenamiento:", e);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [activeRoutine, isPaused, isResting, isLoaded]);

  /**
   * Inicia un nuevo entrenamiento con la rutina seleccionada. Esto establece el estado del entrenamiento activo, resetea los temporizadores y muestra una notificación persistente. Debido a las limitaciones de React Native en segundo plano, esta notificación se mostrará incluso cuando la app esté en segundo plano, pero no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano.
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

        const powerManagerInfo = await notifee.getPowerManagerInfo();
        if (powerManagerInfo.activity) {
          Alert.alert(
            t("activeWorkout.powerManagerAlertTitle"),
            t("activeWorkout.powerManagerAlertMsg"),
            [
              { text: t("common.ignore"), style: "cancel" },
              {
                text: t("common.config"),
                onPress: async () => await notifee.openPowerManagerSettings(),
              },
            ],
          );
        }
      } catch (error) {}

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
      isTransitioningRef.current = false;
      lastTickRef.current = Date.now();
      showActiveWorkoutNotification(routine.name, 0, true);
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Detiene el entrenamiento activo, resetea el estado y cancela la notificación persistente. Esto se llama cuando el usuario cancela el entrenamiento o cuando se detecta que el usuario ha cerrado sesión mientras un entrenamiento está activo. Debido a las limitaciones de React Native en segundo plano, esto también se asegura de cancelar la notificación persistente para evitar que quede una notificación activa en segundo plano si el usuario cancela el entrenamiento o cierra sesión.
   */
  const cancelWorkout = async () => {
    cancelRestAlarm();
    isTransitioningRef.current = false;
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

  // Si el usuario cierra sesión mientras un entrenamiento está activo, cancelamos el entrenamiento para evitar que quede un estado huérfano o una notificación persistente sin un usuario asociado. Debido a las limitaciones de React Native en segundo plano, esto también se asegura de cancelar la notificación persistente si el usuario cierra sesión mientras la app está en segundo plano, aunque ten en cuenta que si el usuario fuerza el cierre de la app, es posible que la notificación no se cancele correctamente, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
  useEffect(() => {
    if (!isLoading && !user && activeRoutine) {
      cancelWorkout();
    }
  }, [user, isLoading, activeRoutine]);

  /**
   * Finaliza el entrenamiento activo, guarda el historial y cancela la notificación persistente de forma silenciosa, sin destruir la UI de inmediato para que el modal de resumen siga visible.
   * @returns
   */
  const finishWorkout = async (measurementSystem?: string, userWeightString?: string) => {
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
          sets: ex.sets.filter((set) => set.completed).map((set) => {
            if (set.weightUnit === "bodyweight" && measurementSystem) {
              return { 
                ...set, 
                bwUnit: measurementSystem === "metric" ? "kg" : "lbs",
                bwUserWeight: userWeightString || "0"
              };
            }
            return set;
          }),
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
   * Reanuda el entrenamiento después de una pausa. Esto actualiza el timestamp del último tick para que el cálculo del tiempo transcurrido sea correcto y muestra la notificación persistente nuevamente. Debido a las limitaciones de React Native en segundo plano, esta notificación se mostrará incluso cuando la app esté en segundo plano, pero no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano.
   */
  const resumeWorkout = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
    isPausedRef.current = false;
    if (isRestingRef.current && restEndTimeRef.current) {
      const remaining = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
      updateRestNotification(remaining, true);
    } else {
      showActiveWorkoutNotification(
        activeRoutine?.name,
        elapsedSecondsRef.current,
        true,
      );
    }
  };

  /**
   * Pausa el entrenamiento activo. Esto detiene el temporizador de tiempo transcurrido y cancela la notificación persistente para evitar que quede una notificación activa en segundo plano mientras el entrenamiento está pausado. Debido a las limitaciones de React Native en segundo plano, esto también se asegura de cancelar la notificación persistente si el usuario pausa el entrenamiento mientras la app está en segundo plano, aunque ten en cuenta que si el usuario fuerza el cierre de la app, es posible que la notificación no se cancele correctamente, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   */
  const pauseWorkout = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    stopAllNotifications();
  };

  /**
   * Reordena los ejercicios en la rutina activa. Esto se llama cuando el usuario reordena los ejercicios en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar el orden de los ejercicios hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param newExercises
   * @returns
   */
  const reorderActiveExercises = useCallback(
    (newExercises: RoutineExercise[]) => {
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        return { ...prev, exercises: newExercises };
      });
    },
    [],
  );

  /**
   * Actualiza el peso o las repeticiones de un set específico en un ejercicio. Esto se llama cuando el usuario edita un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar los detalles del set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @param setId
   * @param field
   * @param val
   * @returns
   */
  const handleSetChange = useCallback(
    (exId: string, setId: string, field: "weight" | "reps", val: string) => {
      const numValue = val === "" ? 0 : Number(val.replace(/[^0-9.]/g, ""));
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.id === exId) {
            const updatedSets = ex.sets.map((s) =>
              s.id === setId ? { ...s, [field]: numValue } : s,
            );
            return { ...ex, sets: updatedSets };
          }
          return ex;
        });
        return { ...prev, exercises: updatedExercises };
      });
    },
    [],
  );

  /**
   * Cambia la unidad de peso de todos los sets de un ejercicio específico. Esto se llama cuando el usuario cambia la unidad de peso en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar la unidad de peso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @param newUnit
   * @returns
   */
  const changeExerciseUnit = useCallback(
    (exId: string, newUnit: WeightUnit) => {
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.id === exId) {
            const updatedSets = ex.sets.map((s) => ({
              ...s,
              weightUnit: newUnit,
            }));
            return { ...ex, sets: updatedSets };
          }
          return ex;
        });
        return { ...prev, exercises: updatedExercises };
      });
    },
    [],
  );

  const changeSetType = useCallback(
    (exId: string, setId: string, newType: SetType) => {
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.id === exId) {
            const updatedSets = ex.sets.map((s) => {
              if (s.id === setId) {
                return { ...s, type: newType };
              }
              return s;
            });
            return { ...ex, sets: updatedSets };
          }
          return ex;
        });
        return { ...prev, exercises: updatedExercises };
      });
    },
    [],
  );

  /**
   * Agrega un nuevo set a un ejercicio específico. El nuevo set se inicializa con el mismo número de repeticiones, peso y unidad que el último set del ejercicio para facilitar la edición. Esto se llama cuando el usuario agrega un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos agregar un nuevo set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @returns
   */
  const addSetToExercise = useCallback((exId: string) => {
    setActiveRoutine((prev) => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map((ex) => {
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
      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  /**
   * Elimina un set específico de un ejercicio. Esto se llama cuando el usuario elimina un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos eliminar un set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @param setId
   * @returns
   */
  const removeSetFromExercise = useCallback((exId: string, setId: string) => {
    setActiveRoutine((prev) => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id === exId)
          return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  /**
   * Marca un set como completado o no completado. Si se marca como completado, inicia el temporizador de descanso utilizando el tiempo de descanso predeterminado del ejercicio. Esto se llama cuando el usuario toca el checkbox de un set en la pantalla de edición del entrenamiento activo.
   *
   * La lógica de inicio del descanso (restEndTimeRef, scheduleRestAlarm, updateRestNotification)
   * se ejecuta fuera y después del setter de estado usando queueMicrotask, para evitar
   * llamar a APIs nativas desde dentro del ciclo de reconciliación de React.
   * @param exId
   * @param setId
   * @param defaultRest
   * @returns
   */
  const toggleSetCompletion = useCallback(
    (exId: string, setId: string, defaultRest: number) => {
      let isMarkingAsComplete = false;

      setActiveRoutine((prev) => {
        if (!prev) return prev;

        const updatedExercises = prev.exercises.map((ex) => {
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

        return { ...prev, exercises: updatedExercises };
      });

      if (isMarkingAsComplete) {
        queueMicrotask(() => {
          const endTimestamp = Date.now() + defaultRest * 1000;
          restEndTimeRef.current = endTimestamp;
          isRestingRef.current = true;
          isTransitioningRef.current = false;
          setIsResting(true);
          setRestTimeRemaining(defaultRest);

          updateRestNotification(defaultRest, true);
          scheduleRestAlarm(endTimestamp);
        });
      }
    },
    [],
  );

  /**
   * Detiene el temporizador de descanso y vuelve al estado normal de entrenamiento activo. Esto se llama cuando el usuario toca el botón "Omitir descanso" en la pantalla de edición del entrenamiento activo mientras está en estado de descanso. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos detener el temporizador de descanso ni mostrar la notificación actualizada hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   */
  const stopRestTimer = () => {
    isRestingRef.current = false;
    restEndTimeRef.current = null;
    isTransitioningRef.current = false;
    setIsResting(false);
    setRestTimeRemaining(null);

    cancelRestAlarm();
    showActiveWorkoutNotification(
      activeRoutine?.name,
      elapsedSecondsRef.current,
      true,
    ).catch(debugError);
  };

  /**
   * Actualiza el tiempo de descanso de un ejercicio específico. Esto se llama cuando el usuario edita el tiempo de descanso de un ejercicio en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar el tiempo de descanso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @param newTime
   * @returns
   */
  const updateExerciseRestTime = useCallback(
    (exId: string, newTime: number) => {
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        const updatedExercises = prev.exercises.map((ex) =>
          ex.id === exId ? { ...ex, restTimeSeconds: newTime } : ex,
        );
        return { ...prev, exercises: updatedExercises };
      });
    },
    [],
  );

  /**
   * Agrega nuevos ejercicios a la rutina activa. Esto se llama cuando el usuario agrega ejercicios desde la pantalla de selección de ejercicios mientras edita el entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos agregar nuevos ejercicios hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param newExercises
   * @returns
   */
  const addExercisesToActiveRoutine = useCallback(
    (newExercises: RoutineExercise[]) => {
      setActiveRoutine((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: [...prev.exercises, ...newExercises],
        };
      });
    },
    [],
  );

  /**
   * Elimina un ejercicio específico de la rutina activa. Esto se llama cuando el usuario elimina un ejercicio en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos eliminar un ejercicio hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   * @param exId
   * @returns
   */
  const removeExerciseFromActiveRoutine = useCallback((exId: string) => {
    setActiveRoutine((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((ex) => ex.id !== exId),
      };
    });
  }, []);

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
        changeSetType,
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

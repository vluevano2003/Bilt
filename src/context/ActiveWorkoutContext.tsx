import notifee, { AndroidImportance } from "@notifee/react-native";
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

  const isPausedRef = useRef(isPaused);
  const isRestingRef = useRef(isResting);
  const lastTickRef = useRef<number>(Date.now());
  const restEndTimeRef = useRef<number | null>(null);

  // Mantenemos refs para isPaused e isResting para que las funciones de temporizador puedan acceder al estado más reciente incluso cuando el código JS está pausado en segundo plano.
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Lo mismo para isResting, aunque en la práctica no podremos actualizar el temporizador de descanso en segundo plano, esto asegura que si el usuario pausa o reanuda el entrenamiento mientras está en segundo plano, el estado se refleje correctamente cuando vuelva a primer plano.
  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  // Configuramos el canal de notificaciones y el modo de audio para asegurarnos de que las notificaciones funcionen correctamente incluso en segundo plano.
  useEffect(() => {
    const setupSystem = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await notifee.createChannel({
        id: WORKOUT_CHANNEL_ID,
        name: t("activeWorkout.notificationChannelName"),
        importance: AndroidImportance.LOW,
      });
    };
    setupSystem();
  }, []);

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
   * Muestra una notificación persistente que indica que el entrenamiento está activo. Esta notificación se muestra incluso cuando la app está en segundo plano, pero debido a las limitaciones de React Native, no puede actualizar dinámicamente el tiempo restante del descanso
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
   * Actualiza la notificación de descanso con el tiempo restante. Debido a las limitaciones de React Native, esta función solo actualizará la notificación si la app está en primer plano. Si la app está en segundo plano, el tiempo restante no se actualizará dinámicamente, pero se mostrará el tiempo restante correcto cuando el usuario vuelva a primer plano.
   * @param remainingSeconds
   */
  const updateRestNotification = async (remainingSeconds: number) => {
    try {
      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: t("activeWorkout.restInProgress"),
        body: `⏱ ${formatRestTimeStr(remainingSeconds)}`,
        android: {
          channelId: WORKOUT_CHANNEL_ID,
          asForegroundService: true,
          color: "#CC5500",
          ongoing: true,
          onlyAlertOnce: true,
          smallIcon: "notification_icon",
        },
      });
    } catch (e) {}
  };

  /**
   * Detiene el servicio en primer plano y cancela la notificación. Esto se llama cuando el entrenamiento se pausa o se cancela para asegurarnos de que no quede una notificación persistente en segundo plano.
   * Debido a las limitaciones de React Native, si el usuario fuerza el cierre de la app, es posible que la notificación no se cancele correctamente, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   */
  const stopAllNotifications = async () => {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(NOTIFICATION_ID);
    } catch (e) {
      debugLog("Error cancelando notificaciones", e);
    }
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
          } else {
            setElapsedSeconds(currentElapsed);
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

  // Configuramos un listener para detectar cuando la app vuelve a primer plano. Cuando esto sucede, calculamos el tiempo transcurrido desde el último tick y actualizamos el estado en consecuencia. Esto nos ayuda a mitigar las limitaciones de React Native en segundo plano, aunque no es perfecto (por ejemplo, si el usuario fuerza el cierre de la app, se perderá el estado).
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

  // Configuramos un intervalo que se ejecuta cada segundo para actualizar el tiempo transcurrido y el tiempo restante del descanso. Sin embargo, debido a las limitaciones de React Native en segundo plano, este intervalo solo funcionará correctamente cuando la app esté en primer plano. Cuando la app está en segundo plano, el código JS se pausa, por lo que no podremos actualizar el tiempo hasta que la app vuelva a primer plano. Para mitigar esto, calculamos el tiempo transcurrido/restante basándonos en timestamps cuando la app vuelve a primer plano, como se muestra en el useEffect anterior.
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

        if (remaining > 0) {
          updateRestNotification(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Cuando el tiempo de descanso llega a 0, detenemos el estado de descanso, reproducimos un sonido y mostramos una notificación indicando que el descanso ha terminado. Debido a las limitaciones de React Native en segundo plano, esta lógica solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, el tiempo restante no se actualizará dinámicamente, pero se mostrará el tiempo restante correcto cuando el usuario vuelva a primer plano.
  useEffect(() => {
    if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
      isRestingRef.current = false;
      setRestTimeRemaining(null);
      restEndTimeRef.current = null;

      playTimerEndSound();

      showActiveWorkoutNotification(activeRoutine?.name, elapsedSeconds);
    }
  }, [isResting, restTimeRemaining]);

  // Cada vez que el estado del entrenamiento cambia, lo guardamos en AsyncStorage para poder restaurarlo si la app se cierra o va a segundo plano. Debido a las limitaciones de React Native en segundo plano, esto es crucial para asegurarnos de que el estado del entrenamiento se mantenga incluso cuando el código JS está pausado. Sin embargo, ten en cuenta que si el usuario fuerza el cierre de la app, se perderá el estado guardado, lo cual es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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

  /**
   * Reproduce un sonido de timbre cuando el temporizador de descanso llega a 0. Debido a las limitaciones de React Native en segundo plano, este sonido solo se reproducirá correctamente cuando la app esté en primer plano. Si la app está en segundo plano, el sonido no se reproducirá hasta que el usuario vuelva a primer plano, momento en el cual se actualizará la notificación con el tiempo restante correcto.
   */
  const playTimerEndSound = async () => {
    try {
      Vibration.vibrate([0, 500, 250, 500]);

      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep.mp3"),
        { shouldPlay: true, volume: 1.0 },
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      debugLog("Error de sonido mp3", error);
    }
  };

  /**
   * Inicia un nuevo entrenamiento con la rutina seleccionada. Esto establece el estado del entrenamiento activo, resetea los temporizadores y muestra una notificación persistente. Debido a las limitaciones de React Native en segundo plano, esta notificación se mostrará incluso cuando la app esté en segundo plano, pero no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano.
   * @param routine
   */
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
    showActiveWorkoutNotification(routine.name, 0);
  };

  /**
   * Detiene el entrenamiento activo, resetea el estado y cancela la notificación persistente. Esto se llama cuando el usuario cancela el entrenamiento o cuando se detecta que el usuario ha cerrado sesión mientras un entrenamiento está activo. Debido a las limitaciones de React Native en segundo plano, esto también se asegura de cancelar la notificación persistente para evitar que quede una notificación activa en segundo plano si el usuario cancela el entrenamiento o cierra sesión.
   */
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
    await stopAllNotifications();
  };

  // Si el usuario cierra sesión mientras un entrenamiento está activo, cancelamos el entrenamiento para evitar que quede un estado huérfano o una notificación persistente sin un usuario asociado. Debido a las limitaciones de React Native en segundo plano, esto también se asegura de cancelar la notificación persistente si el usuario cierra sesión mientras la app está en segundo plano, aunque ten en cuenta que si el usuario fuerza el cierre de la app, es posible que la notificación no se cancele correctamente, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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

    /**
     * Antes de intentar guardar el historial, verificamos el estado de la red para asegurarnos de que el usuario tenga conexión. Si no hay conexión, mostramos una alerta y pausamos el entrenamiento para evitar que el usuario pierda su progreso. Debido a las limitaciones de React Native en segundo plano, esta verificación solo se realizará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos verificar el estado de la red ni mostrar una alerta, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native. Sin embargo, si el usuario intenta finalizar el entrenamiento mientras está en segundo plano, se intentará guardar el historial tan pronto como la app vuelva a primer plano, momento en el cual se verificará el estado de la red y se mostrará la alerta si es necesario.
     */
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

  /**
   * Reanuda el entrenamiento después de una pausa. Esto actualiza el timestamp del último tick para que el cálculo del tiempo transcurrido sea correcto y muestra la notificación persistente nuevamente. Debido a las limitaciones de React Native en segundo plano, esta notificación se mostrará incluso cuando la app esté en segundo plano, pero no podrá actualizar dinámicamente el tiempo restante del descanso o el tiempo total transcurrido hasta que la app vuelva a primer plano.
   */
  const resumeWorkout = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
    isPausedRef.current = false;
    if (isRestingRef.current && restEndTimeRef.current) {
      const remaining = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
      updateRestNotification(remaining);
    } else {
      showActiveWorkoutNotification(activeRoutine?.name, elapsedSeconds);
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
  const reorderActiveExercises = (newExercises: RoutineExercise[]) => {
    if (!activeRoutine) return;
    setActiveRoutine({ ...activeRoutine, exercises: newExercises });
  };

  /**
   * Actualiza el peso o las repeticiones de un set específico en un ejercicio. Esto se llama cuando el usuario edita un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar los detalles del set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
   * Cambia la unidad de peso de todos los sets de un ejercicio específico. Esto se llama cuando el usuario cambia la unidad de peso en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar la unidad de peso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
   * Agrega un nuevo set a un ejercicio específico. El nuevo set se inicializa con el mismo número de repeticiones, peso y unidad que el último set del ejercicio para facilitar la edición. Esto se llama cuando el usuario agrega un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos agregar un nuevo set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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

  /**
   * Elimina un set específico de un ejercicio. Esto se llama cuando el usuario elimina un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos eliminar un set hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
   * Marca un set como completado o no completado. Si se marca como completado, inicia el temporizador de descanso utilizando el tiempo de descanso predeterminado del ejercicio. Esto se llama cuando el usuario toca el checkbox de un set en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos marcar un set como completado ni iniciar el temporizador de descanso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
      setRestTimeRemaining(defaultRest);
      setIsResting(true);
      updateRestNotification(defaultRest);
    }
  };

  /**
   * Detiene el temporizador de descanso y vuelve al estado normal de entrenamiento activo. Esto se llama cuando el usuario toca el botón "Omitir descanso" en la pantalla de edición del entrenamiento activo mientras está en estado de descanso. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos detener el temporizador de descanso ni mostrar la notificación actualizada hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
   */
  const stopRestTimer = () => {
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeRemaining(null);
    restEndTimeRef.current = null;

    showActiveWorkoutNotification(activeRoutine?.name, elapsedSeconds);
  };

  /**
   * Actualiza el tiempo de descanso de un ejercicio específico. Esto se llama cuando el usuario edita el tiempo de descanso de un ejercicio en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos actualizar el tiempo de descanso hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
   * Agrega nuevos ejercicios a la rutina activa. Esto se llama cuando el usuario agrega ejercicios desde la pantalla de selección de ejercicios mientras edita el entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos agregar nuevos ejercicios hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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
   * Elimina un ejercicio específico de la rutina activa. Esto se llama cuando el usuario elimina un ejercicio en la pantalla de edición del entrenamiento activo. Debido a las limitaciones de React Native en segundo plano, esta función solo se ejecutará correctamente cuando la app esté en primer plano. Si la app está en segundo plano, no podremos eliminar un ejercicio hasta que la app vuelva a primer plano, lo que es una limitación conocida de cómo funcionan las apps en segundo plano en React Native.
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

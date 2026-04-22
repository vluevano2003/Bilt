import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

/**
 * Tipos y estructuras de datos para las rutinas de entrenamiento. Incluye definiciones para tipos de sets, unidades de peso, ejercicios, ejercicios en rutinas y la propia rutina. Estas definiciones se utilizan para garantizar la consistencia de los datos a lo largo del hook y facilitar la gestión de las rutinas y ejercicios en la aplicación.
 */
export type SetType =
  | "warmup"
  | "normal"
  | "dropset"
  | "superset"
  | "rest_pause";
export type WeightUnit = "kg" | "lbs" | "bars" | "plates" | "bodyweight";

export interface ExerciseSet {
  id: string;
  type: SetType;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  completed: boolean;
}

export interface ExerciseType {
  id: string;
  muscleGroup:
    | "chest"
    | "back"
    | "legs"
    | "shoulders"
    | "arms"
    | "core"
    | string;
  equipment: "free_weight" | "machine" | "bodyweight" | "cable" | string;
  imageUrl?: string;
}

export interface RoutineExercise {
  id: string;
  exerciseDetails: ExerciseType;
  sets: ExerciseSet[];
  restTimeSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: number;
  originalCreatorId?: string;
  originalCreatorName?: string;
  originalRoutineId?: string;
}

/**
 * Hook personalizado para gestionar rutinas de entrenamiento. Proporciona funcionalidades para cargar, crear, editar y eliminar rutinas, así como para mantener un estado local de las rutinas y ejercicios disponibles en la base de datos.
 * @returns
 */
export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercisesDb, setExercisesDb] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  const { user } = useAuth();
  const currentUserId = user?.id;

  /**
   * Cargar ejercicios desde la base de datos al iniciar el hook. Esto se hace una sola vez y se almacena en el estado `exercisesDb` para su uso posterior en la selección de ejercicios al crear o editar rutinas
   */
  const fetchExercisesFromDB = useCallback(async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("key, muscle_group, equipment, image_url");

      if (error) {
        debugError("Error cargando ejercicios de BD:", error);
        return;
      }

      if (data) {
        const formattedData: ExerciseType[] = data.map((item) => ({
          id: item.key,
          muscleGroup: item.muscle_group,
          equipment: item.equipment,
          imageUrl: item.image_url,
        }));
        setExercisesDb(formattedData);
      }
    } catch (err) {
      debugError("Excepción cargando ejercicios:", err);
    }
  }, []);

  /**
   * Función para cargar las rutinas del usuario desde la base de datos. Se llama al iniciar el hook y cada vez que se detecta un cambio en la tabla de rutinas a través de la suscripción a cambios en Supabase. Si no hay conexión a internet, simplemente se detiene la carga y se muestra el estado sin datos. Si hay conexión, se obtienen las rutinas del usuario, se formatean y se almacenan en el estado `routines`. Cualquier error durante la carga se registra en la consola para su depuración.
   */
  const fetchRoutines = useCallback(async () => {
    if (!currentUserId) return;

    /**
     * Antes de intentar cargar las rutinas, se verifica el estado de la conexión a internet utilizando NetInfo. Si no hay conexión, se detiene la carga y se establece `isLoading` en false para reflejar que no se pueden cargar los datos. Esto evita intentos fallidos de conexión a la base de datos y mejora la experiencia del usuario al no mostrar errores relacionados con la falta de conexión.
     */
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setIsLoading(false);
      return;
    }

    // Si hay conexión, se procede a cargar las rutinas desde la base de datos.
    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      debugError("Error fetching routines:", error);
    } else if (data) {
      const formattedRoutines: Routine[] = data.map((doc) => ({
        id: doc.id,
        name: doc.name,
        exercises: doc.exercises,
        createdAt: new Date(doc.created_at).getTime(),
        originalCreatorId: doc.original_creator_id,
        originalCreatorName: doc.original_creator_name,
        originalRoutineId: doc.original_routine_id,
      }));
      setRoutines(formattedRoutines);
    }
    setIsLoading(false);
  }, [currentUserId]);

  // Se utiliza `useFocusEffect` para recargar las rutinas cada vez que la pantalla que utiliza este hook gana el foco. Esto asegura que cualquier cambio realizado en las rutinas (como creación, edición o eliminación) se refleje inmediatamente cuando el usuario regresa a la pantalla de rutinas.
  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [fetchRoutines]),
  );

  // Se utiliza `useEffect` para cargar los ejercicios desde la base de datos al iniciar el hook y para establecer una suscripción a cambios en la tabla de rutinas en Supabase. Cada vez que se detecta un cambio (creación, edición o eliminación de una rutina), se vuelve a cargar la lista de rutinas para mantener el estado actualizado. Además, se limpia la suscripción al desmontar el componente para evitar fugas de memoria.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchExercisesFromDB();
      await fetchRoutines();
    };

    loadData();

    const channelId = `custom-routines-channel-${Date.now()}-${Math.random()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routines",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          fetchRoutines();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchRoutines, fetchExercisesFromDB]);

  /**
   * Función para guardar una rutina en la base de datos. Puede ser utilizada tanto para crear una nueva rutina (si `routineId` es null) como para actualizar una rutina existente (si `routineId` tiene un valor). Antes de intentar guardar, se verifica que el usuario esté autenticado y que el nombre de la rutina no esté vacío. Si se está creando una nueva rutina, también se verifica que el usuario no haya alcanzado el límite de 10 rutinas propias. Durante el proceso de guardado, se muestra un indicador de carga y se maneja cualquier error que pueda ocurrir, registrándolo en la consola para su depuración. Después de guardar exitosamente, se recargan las rutinas para reflejar los cambios.
   * @param routineId
   * @param name
   * @param exercises
   * @returns
   */
  const saveRoutine = async (
    routineId: string | null,
    name: string,
    exercises: RoutineExercise[] = [],
  ) => {
    if (!currentUserId || !name.trim()) return;

    if (!routineId) {
      const ownRoutines = routines.filter((r) => !r.originalCreatorId);
      if (ownRoutines.length >= 10) {
        Alert.alert(t("alerts.limitReached"), t("routines.limitReached"));
        return;
      }
    }

    setIsSaving(true);
    try {
      if (routineId) {
        const { error } = await supabase
          .from("routines")
          .update({ name, exercises })
          .eq("id", routineId)
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routines")
          .insert([{ user_id: currentUserId, name, exercises }]);
        if (error) throw error;
      }

      await fetchRoutines();
    } catch (error) {
      debugError("Error saving routine:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Función para eliminar una rutina de la base de datos. Se verifica que el usuario esté autenticado y que se haya proporcionado un `routineId` válido antes de intentar eliminar. Durante el proceso de eliminación, se muestra un indicador de carga y se maneja cualquier error que pueda ocurrir, registrándolo en la consola para su depuración. Después de eliminar exitosamente la rutina, se recargan las rutinas para reflejar los cambios. Además, si la rutina eliminada es una rutina original (no una copia), también se eliminan todas las copias de esa rutina.
   * @param routineId
   * @returns
   */
  const deleteRoutine = async (routineId: string) => {
    if (!currentUserId || !routineId) return;
    setIsSaving(true);

    setRoutines((prev) => prev.filter((r) => r.id !== routineId));

    try {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      await supabase
        .from("routines")
        .delete()
        .eq("original_routine_id", routineId);
    } catch (error) {
      debugError("Error deleting routine:", error);
      fetchRoutines();
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    routines,
    exercisesDb,
    isLoading,
    isSaving,
    saveRoutine,
    deleteRoutine,
  };
};

import NetInfo from "@react-native-community/netinfo"; // --- NUEVO ---
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

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

  const fetchRoutines = useCallback(async () => {
    if (!currentUserId) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setIsLoading(false);
      return;
    }

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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchExercisesFromDB();
      await fetchRoutines();
    };

    loadData();

    const channel = supabase
      .channel("custom-routines-channel")
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

  const saveRoutine = async (
    routineId: string | null,
    name: string,
    exercises: RoutineExercise[] = [],
  ) => {
    if (!currentUserId || !name.trim()) return;
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

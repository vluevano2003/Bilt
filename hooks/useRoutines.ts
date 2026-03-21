import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

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
  muscleGroup: "chest" | "back" | "legs" | "shoulders" | "arms" | "core";
  equipment: "free_weight" | "machine" | "bodyweight" | "cable";
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
 * Hook personalizado para gestionar las rutinas de entrenamiento del usuario
 * Proporciona funcionalidades para obtener, crear, actualizar y eliminar rutinas,
 * así como para manejar el estado de carga y guardado
 * @returns
 */
export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id;

  const fetchRoutines = useCallback(async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching routines:", error);
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
    fetchRoutines();

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
  }, [currentUserId, fetchRoutines]);

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
      console.error("Error saving routine:", error);
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
      console.error("Error deleting routine:", error);
      fetchRoutines();
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return { routines, isLoading, isSaving, saveRoutine, deleteRoutine };
};

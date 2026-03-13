import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../src/config/firebase";

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

export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    const routinesRef = collection(db, "users", currentUserId, "routines");
    const q = query(routinesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routinesData: Routine[] = [];
      snapshot.forEach((doc) => {
        routinesData.push({ id: doc.id, ...doc.data() } as Routine);
      });
      // Ordenar por fecha de creación
      routinesData.sort((a, b) => b.createdAt - a.createdAt);
      setRoutines(routinesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const saveRoutine = async (
    routineId: string | null,
    name: string,
    exercises: RoutineExercise[] = [],
  ) => {
    if (!currentUserId || !name.trim()) return;
    setIsSaving(true);
    try {
      if (routineId) {
        // Actualizar rutina existente
        const routineRef = doc(
          db,
          "users",
          currentUserId,
          "routines",
          routineId,
        );
        await updateDoc(routineRef, { name, exercises });
      } else {
        // Crear nueva rutina
        const routinesRef = collection(db, "users", currentUserId, "routines");
        await addDoc(routinesRef, {
          name,
          exercises,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.log("Error saving routine:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    if (!currentUserId) return;
    try {
      const routineRef = doc(db, "users", currentUserId, "routines", routineId);
      await deleteDoc(routineRef);
    } catch (error) {
      console.log("Error deleting routine:", error);
      throw error;
    }
  };
  return {
    routines,
    isLoading,
    isSaving,
    saveRoutine,
    deleteRoutine,
  };
};

import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../src/config/firebase";

export interface WeeklyPack {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName?: string;
  routineIds: string[];
  createdAt: number;
  originalCreatorId?: string;
  originalCreatorName?: string;
  originalPackId?: string;
}

/**
 * Hook personalizado para manejar los packs semanales de un usuario, incluyendo escucha en tiempo real, creación y eliminación en cascada
 * @returns
 */
export const useWeeklyPacks = () => {
  const [packs, setPacks] = useState<WeeklyPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isSavingPack, setIsSavingPack] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    const packsRef = collection(db, "users", currentUserId, "weekly_packs");
    const q = query(packsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const packsData: WeeklyPack[] = [];
      snapshot.forEach((doc) => {
        packsData.push({ id: doc.id, ...doc.data() } as WeeklyPack);
      });
      packsData.sort((a, b) => b.createdAt - a.createdAt);
      setPacks(packsData);
      setIsLoadingPacks(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  /**
   * Función para guardar un nuevo pack semanal o actualizar uno existente, con soporte para packs originales y copias
   * @param name
   * @param description
   * @param routineIds
   * @param originalCreatorId
   * @param originalCreatorName
   * @param originalPackId
   * @returns
   */
  const saveWeeklyPack = async (
    name: string,
    description: string,
    routineIds: string[],
    originalCreatorId?: string,
    originalCreatorName?: string,
    originalPackId?: string,
  ) => {
    if (!currentUserId || !name.trim() || routineIds.length === 0) return;
    setIsSavingPack(true);
    try {
      const packsRef = collection(db, "users", currentUserId, "weekly_packs");
      await addDoc(packsRef, {
        name,
        description,
        creatorId: currentUserId,
        routineIds,
        createdAt: Date.now(),
        originalCreatorId: originalCreatorId || null,
        originalCreatorName: originalCreatorName || null,
        originalPackId: originalPackId || null,
      });
    } catch (error) {
      console.error("Error guardando el pack:", error);
      throw error;
    } finally {
      setIsSavingPack(false);
    }
  };

  /**
   * Función para eliminar un pack semanal, eliminando también todas las copias que otros usuarios hayan guardado de ese pack
   * @param packId
   * @returns
   */
  const deletePack = async (packId: string) => {
    if (!currentUserId) return;
    try {
      const packRef = doc(db, "users", currentUserId, "weekly_packs", packId);
      await deleteDoc(packRef);

      const savedQuery = query(
        collectionGroup(db, "weekly_packs"),
        where("originalPackId", "==", packId),
      );

      const savedSnapshot = await getDocs(savedQuery);

      const deletePromises = savedSnapshot.docs.map((docSnap) =>
        deleteDoc(docSnap.ref),
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error eliminando el pack:", error);
      throw error;
    }
  };

  return { packs, isLoadingPacks, isSavingPack, saveWeeklyPack, deletePack };
};

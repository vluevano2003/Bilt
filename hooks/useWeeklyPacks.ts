import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

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
 * Hook para gestionar los Weekly Packs del usuario actual, incluyendo la sincronización en tiempo real con Supabase
 * @returns
 */
export const useWeeklyPacks = () => {
  const [packs, setPacks] = useState<WeeklyPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isSavingPack, setIsSavingPack] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id;

  const fetchPacks = useCallback(async () => {
    if (!currentUserId) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setIsLoadingPacks(false);
      return;
    }

    const { data, error } = await supabase
      .from("weekly_packs")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      debugError("Error fetching packs:", error);
    } else if (data) {
      const formattedPacks: WeeklyPack[] = data.map((doc) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        creatorId: doc.user_id,
        routineIds: doc.routine_ids || [],
        createdAt: new Date(doc.created_at).getTime(),
        originalCreatorId: doc.original_creator_id,
        originalCreatorName: doc.original_creator_name,
        originalPackId: doc.original_pack_id,
      }));
      setPacks(formattedPacks);
    }
    setIsLoadingPacks(false);
  }, [currentUserId]);

  useEffect(() => {
    fetchPacks();

    const channel = supabase
      .channel("custom-weekly-packs-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_packs",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => fetchPacks(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchPacks]);

  /**
   * Guarda un nuevo Weekly Pack en Supabase. Si se proporciona originalCreatorId, originalCreatorName y originalPackId, se considerará una copia de un pack existente
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
      const { error } = await supabase.from("weekly_packs").insert([
        {
          user_id: currentUserId,
          name,
          description,
          routine_ids: routineIds,
          original_creator_id: originalCreatorId || null,
          original_creator_name: originalCreatorName || null,
          original_pack_id: originalPackId || null,
        },
      ]);
      if (error) throw error;

      await fetchPacks();
    } catch (error) {
      debugError("Error guardando el pack:", error);
      throw error;
    } finally {
      setIsSavingPack(false);
    }
  };

  /**
   * Elimina un Weekly Pack de Supabase. Si el pack eliminado es un original (no tiene originalPackId), también eliminará todas las copias que tengan originalPackId igual al id del pack eliminado
   * @param packId
   * @returns
   */
  const deletePack = async (packId: string) => {
    if (!currentUserId || !packId) return;
    setIsSavingPack(true);

    setPacks((prev) => prev.filter((p) => p.id !== packId));

    try {
      const { error } = await supabase
        .from("weekly_packs")
        .delete()
        .eq("id", packId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      await supabase
        .from("weekly_packs")
        .delete()
        .eq("original_pack_id", packId);
    } catch (error) {
      debugError("Error eliminando el pack:", error);
      fetchPacks();
      throw error;
    } finally {
      setIsSavingPack(false);
    }
  };

  return { packs, isLoadingPacks, isSavingPack, saveWeeklyPack, deletePack };
};

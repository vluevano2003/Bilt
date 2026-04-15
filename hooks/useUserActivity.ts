import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { WeeklyPack } from "./useWeeklyPacks";

/**
 * Custom hook para gestionar la actividad del usuario: rutinas, historial y packs
 * @param userId
 * @returns
 */
export const useUserActivity = (userId?: string) => {
  const [userRoutines, setUserRoutines] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userPacks, setUserPacks] = useState<WeeklyPack[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!userId) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setIsLoadingActivity(false);
      return;
    }

    const { data: routinesData } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", userId);

    if (routinesData) {
      setUserRoutines(
        routinesData.map((d) => ({
          id: d.id,
          ...d,
          originalCreatorId: d.original_creator_id,
          originalRoutineId: d.original_routine_id,
          createdAt: new Date(d.created_at).getTime(),
        })),
      );
    }

    const { data: historyData } = await supabase
      .from("history")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (historyData) {
      setUserHistory(
        historyData.map((d) => ({
          id: d.id,
          routineName: d.routine_name,
          durationSeconds: d.duration_seconds,
          exercises: d.exercises,
          completedAt: new Date(d.completed_at).getTime(),
        })),
      );
    }

    const { data: packsData } = await supabase
      .from("weekly_packs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (packsData) {
      setUserPacks(
        packsData.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          routineIds: d.routine_ids,
          originalCreatorId: d.original_creator_id,
          originalPackId: d.original_pack_id,
          createdAt: new Date(d.created_at).getTime(),
        })) as WeeklyPack[],
      );
    }

    setIsLoadingActivity(false);
  }, [userId]);

  /**
   * Refetch de la actividad cada vez que la pantalla gana foco, para asegurar datos actualizados
   */
  useFocusEffect(
    useCallback(() => {
      fetchActivity();
    }, [fetchActivity]),
  );

  useEffect(() => {
    if (!userId) return;
    setIsLoadingActivity(true);
    fetchActivity();

    const channel = supabase
      .channel(`user-activity-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routines",
          filter: `user_id=eq.${userId}`,
        },
        fetchActivity,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "history",
          filter: `user_id=eq.${userId}`,
        },
        fetchActivity,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_packs",
          filter: `user_id=eq.${userId}`,
        },
        fetchActivity,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchActivity]);

  return { userRoutines, userHistory, userPacks, isLoadingActivity };
};

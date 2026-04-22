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

  /**
   * Función para fetch de la actividad del usuario (rutinas, historial y packs)
   */
  const fetchActivity = useCallback(async () => {
    if (!userId) return;

    /**
     * Antes de hacer cualquier fetch, verificamos el estado de la red. Si no hay conexión, evitamos hacer llamadas a la API y simplemente dejamos el estado de carga en false para que la UI pueda manejarlo adecuadamente. Esto es especialmente importante en dispositivos móviles donde la conectividad puede ser intermitente.
     */
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setIsLoadingActivity(false);
      return;
    }

    // Fetch de rutinas, historial y packs del usuario desde Supabase
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

    // El fetch del historial y packs se hace después del de rutinas para asegurar que cualquier rutina referenciada en el historial o packs ya esté cargada en el estado, lo que facilita la asociación de datos si es necesario.
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

    // El fetch de packs se hace al final para asegurar que cualquier pack que haga referencia a rutinas ya tenga esas rutinas cargadas en el estado, lo que facilita la asociación de datos si es necesario.
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

  // Refetch de la actividad cada vez que el usuario vuelve a la pantalla para asegurar que siempre tenga los datos más recientes, especialmente si ha estado inactivo por un tiempo o ha hecho cambios desde otra parte de la app.
  useFocusEffect(
    useCallback(() => {
      fetchActivity();
    }, [fetchActivity]),
  );

  // Suscripción a cambios en las tablas de rutinas, historial y packs para refetch automático cuando haya cambios relevantes para el usuario
  useEffect(() => {
    if (!userId) return;
    setIsLoadingActivity(true);
    fetchActivity();

    /**
     * La suscripción a cambios en Supabase se configura para escuchar cualquier cambio (inserciones, actualizaciones o eliminaciones) en las tablas de rutinas, historial y packs que estén relacionados con el usuario actual. Esto asegura que la actividad del usuario se mantenga actualizada en tiempo real sin necesidad de que el usuario tenga que refrescar manualmente la pantalla. Cada vez que se detecta un cambio relevante, se llama a la función fetchActivity para refetch los datos y actualizar el estado de la UI en consecuencia.
     */
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

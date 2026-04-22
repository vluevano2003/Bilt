import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

export interface FeedItem {
  id: string;
  type: "routine" | "history";
  userId: string;
  username: string;
  userAvatar?: string;
  timestamp: number;
  title: string;
  details: {
    duration?: number;
    volume?: number;
    exerciseCount?: number;
  };
}

/**
 * Hook para obtener el feed social del usuario, incluyendo rutinas creadas y entrenamientos completados por los usuarios que sigue
 * @returns
 */
export const useSocialFeed = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  /**
   * Función para obtener el feed social del usuario. Primero verifica la conexión a internet, luego obtiene la lista de usuarios que sigue, y finalmente obtiene las rutinas creadas y entrenamientos completados por esos usuarios para construir el feed. El feed se ordena por fecha de creación/completado, mostrando los más recientes primero.
   */
  const fetchFeed = useCallback(async () => {
    if (!user?.id) return;

    /**
     * Verificar la conexión a internet antes de intentar obtener el feed. Si no hay conexión, se detiene la carga y se muestra un mensaje de error. Esto es importante para evitar intentos fallidos de obtener datos y para mejorar la experiencia del usuario en situaciones de conectividad limitada.
     */
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setLoadingFeed(false);
      return;
    }

    try {
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .eq("status", "accepted");

      if (!followingData || followingData.length === 0) {
        setFeed([]);
        return;
      }

      const followedIds = followingData.map((f) => f.following_id);

      // Obtener información de los usuarios seguidos para mostrar su nombre y avatar en el feed
      const { data: usersData } = await supabase
        .from("users")
        .select("id, username, profile_picture_url, measurement_system, weight")
        .in("id", followedIds);

      const userMap: Record<string, any> = {};
      if (usersData) {
        usersData.forEach((u) => {
          userMap[u.id] = u;
        });
      }

      let allItems: FeedItem[] = [];

      const { data: historyData } = await supabase
        .from("history")
        .select("*")
        .in("user_id", followedIds)
        .order("completed_at", { ascending: false })
        .limit(100);

      if (historyData) {
        historyData.forEach((d) => {
          const userSys = userMap[d.user_id]?.measurement_system || "metric";
          const userW = Number(userMap[d.user_id]?.weight) || 0;

          let totalVolume = 0;
          d.exercises?.forEach((ex: any) => {
            ex.sets?.forEach((set: any) => {
              if (set.completed) {
                let w = Number(set.weight) || 0;
                if (set.weightUnit === "bars" || set.weightUnit === "plates") {
                  w = 0;
                } else if (set.weightUnit === "bodyweight") {
                  w += userW;
                } else {
                  if (userSys === "metric" && set.weightUnit === "lbs")
                    w *= 0.453592;
                  if (userSys === "imperial" && set.weightUnit === "kg")
                    w *= 2.20462;
                }
                totalVolume += w * (set.reps || 0);
              }
            });
          });

          allItems.push({
            id: `hist_${d.id}`,
            type: "history",
            userId: d.user_id,
            username: userMap[d.user_id]?.username || t("social.user"),
            userAvatar: userMap[d.user_id]?.profile_picture_url,
            timestamp: new Date(d.completed_at).getTime(),
            title: d.routine_name || "",
            details: {
              duration: d.duration_seconds,
              volume: Math.round(totalVolume),
            },
          });
        });
      }

      const { data: routinesData } = await supabase
        .from("routines")
        .select("*")
        .in("user_id", followedIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (routinesData) {
        routinesData.forEach((d) => {
          if (!d.original_creator_id || d.original_creator_id === d.user_id) {
            allItems.push({
              id: `rout_${d.id}`,
              type: "routine",
              userId: d.user_id,
              username: userMap[d.user_id]?.username || t("social.user"),
              userAvatar: userMap[d.user_id]?.profile_picture_url,
              timestamp: new Date(d.created_at).getTime(),
              title: d.name,
              details: {
                exerciseCount: d.exercises?.length || 0,
              },
            });
          }
        });
      }

      allItems.sort((a, b) => b.timestamp - a.timestamp);
      setFeed(allItems);
    } catch (error) {
      debugError("Error fetching feed:", error);
    }
  }, [user?.id]);

  // Refrescar el feed cada vez que la pantalla gana foco, para mostrar las actualizaciones más recientes de los usuarios seguidos
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed]),
  );

  // Cargar el feed inicialmente al montar el hook
  useEffect(() => {
    setLoadingFeed(true);
    fetchFeed().then(() => setLoadingFeed(false));
  }, [fetchFeed]);

  /**
   * Función para manejar la acción de refrescar el feed. Se activa al hacer pull-to-refresh en la pantalla del feed social. Establece el estado de refreshing a true, llama a fetchFeed para obtener los datos más recientes, y luego establece refreshing a false una vez que se completa la carga. Esto permite a los usuarios actualizar manualmente su feed para ver las últimas actividades de sus amigos.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  return { feed, loadingFeed, refreshing, onRefresh };
};

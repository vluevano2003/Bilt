import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

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

  const fetchFeed = useCallback(async () => {
    if (!user?.id) return;

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
            username: userMap[d.user_id]?.username || "Usuario",
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
              username: userMap[d.user_id]?.username || "Usuario",
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
      console.error("Error fetching feed:", error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed]),
  );

  useEffect(() => {
    setLoadingFeed(true);
    fetchFeed().then(() => setLoadingFeed(false));
  }, [fetchFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  return { feed, loadingFeed, refreshing, onRefresh };
};

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

import { useTranslation } from "react-i18next";

export const ACHIEVEMENTS_LIST = [
  { id: "workouts_1", titleKey: "achievements.workouts_1.title", descKey: "achievements.workouts_1.desc", color: "#38bdf8", icon: "play" },
  { id: "workouts_5", titleKey: "achievements.workouts_5.title", descKey: "achievements.workouts_5.desc", color: "#60a5fa", icon: "activity" },
  { id: "workouts_10", titleKey: "achievements.workouts_10.title", descKey: "achievements.workouts_10.desc", color: "#3b82f6", icon: "star" },
  { id: "workouts_50", titleKey: "achievements.workouts_50.title", descKey: "achievements.workouts_50.desc", color: "#2563eb", icon: "award" },
  { id: "workouts_100", titleKey: "achievements.workouts_100.title", descKey: "achievements.workouts_100.desc", color: "#1d4ed8", icon: "shield" },
  { id: "workouts_365", titleKey: "achievements.workouts_365.title", descKey: "achievements.workouts_365.desc", color: "#1e40af", icon: "sun" },
  { id: "workouts_1000", titleKey: "achievements.workouts_1000.title", descKey: "achievements.workouts_1000.desc", color: "#172554", icon: "target" },
  { id: "streak_2", titleKey: "achievements.streak_2.title", descKey: "achievements.streak_2.desc", color: "#fca5a5", icon: "zap" },
  { id: "streak_4", titleKey: "achievements.streak_4.title", descKey: "achievements.streak_4.desc", color: "#f87171", icon: "zap" },
  { id: "streak_10", titleKey: "achievements.streak_10.title", descKey: "achievements.streak_10.desc", color: "#ef4444", icon: "fire" },
  { id: "streak_30", titleKey: "achievements.streak_30.title", descKey: "achievements.streak_30.desc", color: "#dc2626", icon: "fire" },
  { id: "streak_50", titleKey: "achievements.streak_50.title", descKey: "achievements.streak_50.desc", color: "#b91c1c", icon: "fire" },
  { id: "streak_100", titleKey: "achievements.streak_100.title", descKey: "achievements.streak_100.desc", color: "#991b1b", icon: "fire" },
  { id: "streak_200", titleKey: "achievements.streak_200.title", descKey: "achievements.streak_200.desc", color: "#7f1d1d", icon: "fire" },
];

export const useAchievements = (userId?: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
    
    if (!userId) return;

    const channel = supabase
      .channel(`public:user_achievements:user_id=eq.${userId}-${Math.random().toString(36).substring(7)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAchievements, userId]);

  return { achievements, loading, refetchAchievements: fetchAchievements };
};

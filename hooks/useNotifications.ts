import { useCallback, useEffect, useState } from "react";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";
import { SocialUser } from "./useProfile";

export interface NotificationItem {
  id: string;
  type: "new_follower" | "follow_request" | "request_accepted";
  createdAt: string;
  actor: {
    id: string;
    username: string;
    profilePictureUrl?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SocialUser[]>([]);
  const [history, setHistory] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id)
        .eq("status", "pending");

      if (!followsError && followsData && followsData.length > 0) {
        const followerIds = followsData.map((f: any) => f.follower_id);
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username, profile_picture_url")
          .in("id", followerIds);

        if (usersData) {
          const reqs: SocialUser[] = usersData.map((u: any) => ({
            id: u.id,
            username: u.username || "Usuario",
            profilePictureUrl: u.profile_picture_url,
            status: "pending" as const,
          }));
          setRequests(reqs);
        }
      } else {
        setRequests([]);
      }

      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .select(
          `
          id, type, created_at,
          actor:users!actor_id (id, username, profile_picture_url)
        `,
        )
        .eq("recipient_id", user.id)
        .neq("type", "follow_request")
        .order("created_at", { ascending: false })
        .limit(30);

      if (notifData) {
        const validHistory: NotificationItem[] = [];

        notifData.forEach((n: any) => {
          let actorData = null;
          if (Array.isArray(n.actor) && n.actor.length > 0) {
            actorData = n.actor[0];
          } else if (n.actor && !Array.isArray(n.actor)) {
            actorData = n.actor;
          }

          if (actorData && actorData.id) {
            validHistory.push({
              id: n.id,
              type: n.type as
                | "new_follower"
                | "follow_request"
                | "request_accepted",
              createdAt: n.created_at,
              actor: {
                id: actorData.id,
                username: actorData.username || "Usuario",
                profilePictureUrl: actorData.profile_picture_url,
              },
            });
          }
        });

        setHistory(validHistory);
      }
    } catch (error) {
      console.log("Error inesperado fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();

    if (!user?.id) return;

    const channel = supabase
      .channel("notifs_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  return {
    loading,
    requests,
    history,
    refetch: fetchNotifications,
    setRequests,
  };
};

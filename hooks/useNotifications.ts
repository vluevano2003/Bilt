import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    isPrivate?: boolean;
  };
}

/**
 * Hook para manejar notificaciones de seguidores y solicitudes de seguimiento.
 * Proporciona la lista de solicitudes pendientes, el historial de notificaciones y una función para aceptar/rechazar solicitudes.
 * @returns
 */
export const useNotifications = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SocialUser[]>([]);
  const [history, setHistory] = useState<NotificationItem[]>([]);

  /**
   * Función para obtener las notificaciones y solicitudes pendientes del usuario actual.
   * Realiza varias consultas a la base de datos para obtener la información necesaria y filtra duplicados.
   * Se llama al montar el componente y cada vez que se detecta un cambio relevante en la base de datos.
   * Maneja errores de forma robusta y asegura que el estado se actualice correctamente.
   */
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
            username: u.username || t("social.user"),
            profilePictureUrl: u.profile_picture_url,
            status: "pending" as const,
          }));
          setRequests(reqs);
        }
      } else {
        setRequests([]);
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select(
          `
          id, type, created_at,
          actor:users!actor_id (id, username, profile_picture_url, is_private)
        `,
        )
        .eq("recipient_id", user.id)
        .neq("type", "follow_request")
        .order("created_at", { ascending: false })
        .limit(40);

      if (notifData) {
        const validHistory: NotificationItem[] = [];
        const seenDuplicates = new Set();

        notifData.forEach((n: any) => {
          let actorData = null;
          if (Array.isArray(n.actor) && n.actor.length > 0) {
            actorData = n.actor[0];
          } else if (n.actor && !Array.isArray(n.actor)) {
            actorData = n.actor;
          }

          if (actorData && actorData.id) {
            const uniqueKey = `${n.type}-${actorData.id}`;
            if (!seenDuplicates.has(uniqueKey)) {
              seenDuplicates.add(uniqueKey);

              validHistory.push({
                id: n.id,
                type: n.type as
                  | "new_follower"
                  | "follow_request"
                  | "request_accepted",
                createdAt: n.created_at,
                actor: {
                  id: actorData.id,
                  username: actorData.username || t("social.user"),
                  profilePictureUrl: actorData.profile_picture_url,
                  isPrivate: actorData.is_private || false,
                },
              });
            }
          }
        });

        // Filtrar el historial para mostrar solo seguidores reales en "new_follower" y "request_accepted"
        const actorIds = validHistory.map((h) => h.actor.id);
        if (actorIds.length > 0) {
          const { data: incoming } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", user.id)
            .eq("status", "accepted");

          const { data: outgoing } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("status", "accepted");

          const incomingSet = new Set(
            incoming?.map((f) => f.follower_id) || [],
          );
          const outgoingSet = new Set(
            outgoing?.map((f) => f.following_id) || [],
          );

          const strictHistory = validHistory.filter((h) => {
            if (h.type === "new_follower") return incomingSet.has(h.actor.id);
            if (h.type === "request_accepted")
              return outgoingSet.has(h.actor.id);
            return true;
          });

          setHistory(strictHistory);
        } else {
          setHistory([]);
        }
      }
    } catch (error) {
      console.log("Error inesperado fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Configurar suscripción a cambios en la base de datos para actualizar notificaciones en tiempo real
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
        () => fetchNotifications(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  /**
   * Función para manejar la aceptación o rechazo de una solicitud de seguimiento.
   * Actualiza el estado local para reflejar la acción del usuario y realiza las operaciones necesarias en la base de datos.
   * En caso de aceptar, actualiza el estado del follow a "accepted" y crea una notificación de "request_accepted".
   * En caso de rechazar, elimina el follow pendiente y la notificación de "follow_request".
   * Maneja errores de forma robusta y asegura que el estado se mantenga consistente incluso si ocurre un error.
   * @param userIdToHandle
   * @param accept
   * @returns
   */
  const handleRequest = async (userIdToHandle: string, accept: boolean) => {
    if (!user?.id) return;

    const requestUser = requests.find((r) => r.id === userIdToHandle);

    setRequests((prev) => prev.filter((r) => r.id !== userIdToHandle));
    if (accept && requestUser) {
      const newHistoryItem: NotificationItem = {
        id: `temp-${Date.now()}`,
        type: "new_follower",
        createdAt: new Date().toISOString(),
        actor: {
          id: requestUser.id,
          username: requestUser.username || t("social.user"),
          profilePictureUrl: requestUser.profilePictureUrl,
          isPrivate: false,
        },
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
    }

    try {
      if (accept) {
        const { error: followError } = await supabase
          .from("follows")
          .update({ status: "accepted" })
          .eq("follower_id", userIdToHandle)
          .eq("following_id", user.id);

        if (followError)
          throw new Error(`Error en follows: ${followError.message}`);

        const { error: updateError } = await supabase
          .from("notifications")
          .update({
            type: "new_follower",
            created_at: new Date().toISOString(),
          })
          .eq("recipient_id", user.id)
          .eq("actor_id", userIdToHandle)
          .eq("type", "follow_request");

        if (updateError)
          throw new Error(
            `Error actualizando notificación: ${updateError.message}`,
          );

        const { error: insertError } = await supabase
          .from("notifications")
          .insert({
            recipient_id: userIdToHandle,
            actor_id: user.id,
            type: "request_accepted",
          });

        if (insertError)
          throw new Error(`Error insertando accepted: ${insertError.message}`);
      } else {
        const { error: deleteFollowError } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userIdToHandle)
          .eq("following_id", user.id);

        if (deleteFollowError)
          throw new Error(
            `Error borrando follow: ${deleteFollowError.message}`,
          );

        const { error: deleteNotifError } = await supabase
          .from("notifications")
          .delete()
          .eq("recipient_id", user.id)
          .eq("actor_id", userIdToHandle)
          .eq("type", "follow_request");

        if (deleteNotifError)
          throw new Error(
            `Error borrando notificación: ${deleteNotifError.message}`,
          );
      }
    } catch (e) {
      console.error("Fallo crítico en handleRequest:", e);
      fetchNotifications();
    }
  };

  return {
    loading,
    requests,
    history,
    refetch: fetchNotifications,
    handleRequest,
  };
};

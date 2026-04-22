import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

export interface SocialUser {
  id: string;
  username: string;
  profilePictureUrl?: string;
  status?: "pending" | "accepted";
}

/**
 * Envía notificación push a través de la Edge Function de Supabase.
 * Exportada para poder reutilizarla en otros hooks (ej. useNotifications)
 */
export async function sendPushNotificationViaEdgeFunction(
  recipientUserId: string,
  title: string,
  body: string,
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { error } = await supabase.functions.invoke(
      "send-push-notification",
      {
        body: { recipientUserId, title, body },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    if (error) console.log("Error enviando notificación:", error);
  } catch (e) {
    console.log("Error inesperado:", e);
  }
}

/**
 * Hook para manejar toda la lógica relacionada con el perfil de usuario, tanto el propio como el de otros usuarios.
 * @param profileUid
 * @returns
 */
export const useProfile = (profileUid?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const currentUserId = user?.id;
  const targetUid = profileUid || currentUserId;
  const isOwnProfile = targetUid === currentUserId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bio, setBio] = useState("");
  const [measurementSystem, setMeasurementSystem] = useState<
    "metric" | "imperial"
  >("metric");
  const [targetLocale, setTargetLocale] = useState("es");

  const [editUsername, setEditUsername] = useState("");
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editMeasurementSystem, setEditMeasurementSystem] = useState<
    "metric" | "imperial"
  >("metric");

  const [isPrivate, setIsPrivate] = useState(false);
  const [followStatus, setFollowStatus] = useState<
    "none" | "pending" | "following"
  >("none");
  const [hasPendingRequestFromThem, setHasPendingRequestFromThem] =
    useState(false);
  const [theyFollowMe, setTheyFollowMe] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);

  /**
   * Función para obtener los datos del perfil. Se llama al cargar el hook y cada vez que se recibe una actualización en el perfil a través de Supabase Realtime.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUid)
        .single();

      if (error || !data) {
        setHasBlockedMe(true);
        setIsLoading(false);
        return;
      }

      setUsername(data.username || "");
      setProfilePic(data.profile_picture_url || null);
      setEmail(data.email || "");
      setGender(data.gender || "");
      setMeasurementSystem(data.measurement_system || "metric");
      setHeight(data.height?.toString() || "");
      setWeight(data.weight?.toString() || "");
      setBio(data.bio || "");
      setTargetLocale(data.locale || "es");
      setIsPrivate(data.is_private || false);
      setIsLoading(false);
    } catch (err) {
      setHasBlockedMe(true);
      setIsLoading(false);
    }
  }, [targetUid]);

  /**
   * Función para obtener los datos sociales relacionados con el perfil (seguidores, siguiendo, estado de seguimiento, bloqueos). Se llama al cargar el hook y cada vez que se recibe una actualización en las tablas relacionadas a través de Supabase Realtime.
   */
  const fetchSocialStats = useCallback(async () => {
    if (!isOwnProfile) {
      const { data: myBlock } = await supabase
        .from("blocks")
        .select("*")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", targetUid)
        .single();
      setIsBlocked(!!myBlock);

      // Si yo no los tengo bloqueados, reviso si ellos me tienen bloqueado
      const { data: theirBlock } = await supabase
        .from("blocks")
        .select("*")
        .eq("blocker_id", targetUid)
        .eq("blocked_id", currentUserId)
        .single();
      setHasBlockedMe(!!theirBlock);
    }

    // Si hay bloqueo de por medio, no tiene sentido seguir consultando datos sociales
    const { count: fCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUid)
      .eq("status", "accepted");
    setFollowersCount(fCount || 0);

    // Si el perfil es privado y no es mi perfil, no consulto a quién sigue
    const { count: followingC } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUid)
      .eq("status", "accepted");
    setFollowingCount(followingC || 0);

    // Si es mi perfil, consulto también cuántas solicitudes pendientes tengo y si ellos me siguen o tienen solicitud pendiente
    if (isOwnProfile) {
      const { count: pCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUid)
        .eq("status", "pending");
      setPendingRequestsCount(pCount || 0);
    } else {
      const { data: myFollow } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUid)
        .single();

      setFollowStatus(
        myFollow
          ? myFollow.status === "accepted"
            ? "following"
            : "pending"
          : "none",
      );

      // Si no los sigo, reviso si ellos me siguen o tienen solicitud pendiente
      const { data: theirRequest } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", targetUid)
        .eq("following_id", currentUserId)
        .single();

      setHasPendingRequestFromThem(theirRequest?.status === "pending");
      setTheyFollowMe(theirRequest?.status === "accepted");
    }
  }, [targetUid, currentUserId, isOwnProfile]);

  // Efecto para cargar datos del perfil y escuchar cambios en el perfil a través de Supabase Realtime
  useEffect(() => {
    if (!targetUid) return;

    fetchProfile();

    /**
     * Suscripción a cambios en la tabla de usuarios para actualizar el perfil en tiempo real si hay cambios. Solo se suscribe al perfil que se está visualizando (targetUid) para evitar recibir eventos innecesarios.
     */
    const channel = supabase
      .channel(`public:users:id=eq.${targetUid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${targetUid}`,
        },
        () => fetchProfile(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUid, fetchProfile]);

  useEffect(() => {
    if (!targetUid || !currentUserId) return;

    fetchSocialStats();

    /**
     * Suscripción a cambios en la tabla de follows para actualizar los datos sociales en tiempo real. Se suscribe a cualquier cambio que involucre al usuario objetivo (ya sea como seguidor o seguido) para mantener actualizados los contadores y estados de seguimiento.
     */
    const followsChannel = supabase
      .channel(`follows-changes-${targetUid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        () => fetchSocialStats(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(followsChannel);
    };
  }, [targetUid, currentUserId, isOwnProfile, fetchSocialStats]);

  /**
   * Función para refrescar manualmente los datos del perfil y sociales, útil para pasar a las pantallas de seguidores/seguidos y forzar una actualización al volver, o para cualquier otro caso donde queramos asegurarnos de tener los datos más recientes sin esperar a la actualización en tiempo real.
   */
  const refetchData = async () => {
    await Promise.all([fetchProfile(), fetchSocialStats()]);
  };

  /**
   * Función para abrir el modal de edición de perfil, que precarga los datos actuales del perfil en los campos de edición. Solo se activa si es el propio perfil (isOwnProfile) para evitar que otros usuarios puedan editar perfiles ajenos.
   */
  const openEditModal = () => {
    setEditUsername(username);
    setEditHeight(height);
    setEditWeight(weight);
    setEditBio(bio);
    setEditMeasurementSystem(measurementSystem);
    setNewProfilePic(null);
    setIsEditing(true);
  };

  /**
   * Función para abrir el selector de imágenes y permitir al usuario elegir una nueva foto de perfil. Solo se activa si es el propio perfil (isOwnProfile) para evitar que otros usuarios puedan cambiar la foto de perfil ajena.
   * @returns
   */
  const pickImage = async () => {
    if (!isOwnProfile) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setNewProfilePic(result.assets[0].uri);
    }
  };

  /**
   * Función para guardar los cambios realizados en el perfil. Si se ha seleccionado una nueva foto de perfil, primero la sube a Supabase Storage y obtiene la URL pública para guardarla en el perfil. Luego actualiza los datos del usuario en la tabla "users" y maneja los estados de carga y edición. Solo se activa si es el propio perfil (isOwnProfile) para evitar que otros usuarios puedan guardar cambios en perfiles ajenos.
   * @returns
   */
  const handleSave = async () => {
    if (!currentUserId || !isOwnProfile) return;
    setIsSaving(true);

    try {
      let profileUrl = profilePic;

      if (newProfilePic) {
        const response = await fetch(newProfilePic);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile_pictures")
          .upload(`${currentUserId}/${Date.now()}.jpg`, arrayBuffer, {
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("profile_pictures")
            .getPublicUrl(uploadData.path);
          profileUrl = publicUrlData.publicUrl;
        }
      }

      const parsedHeight = parseFloat(editHeight.replace(",", "."));
      const parsedWeight = parseFloat(editWeight.replace(",", "."));

      const { error } = await supabase
        .from("users")
        .update({
          username: editUsername.trim(),
          profile_picture_url: profileUrl,
          measurement_system: editMeasurementSystem,
          height: isNaN(parsedHeight) ? null : parsedHeight,
          weight: isNaN(parsedWeight) ? null : parsedWeight,
          bio: editBio.trim(),
        })
        .eq("id", currentUserId);

      if (error) throw error;

      setUsername(editUsername.trim());
      setMeasurementSystem(editMeasurementSystem);
      setHeight(editHeight);
      setWeight(editWeight);
      setBio(editBio.trim());
      setProfilePic(profileUrl);

      setNewProfilePic(null);
      setIsEditing(false);
      Alert.alert(t("profile.alerts.success"), t("profile.alerts.successSave"));
    } catch (error: any) {
      if (error?.code === "23505") {
        Alert.alert(
          t("profile.alerts.usernameTakenTitle"),
          t("profile.alerts.usernameTakenMsg"),
        );
      } else {
        Alert.alert(t("profile.alerts.error"), t("profile.alerts.errorSave"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewProfilePic(null);
    setIsEditing(false);
  };

  const togglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    if (!currentUserId || !isOwnProfile) return;
    try {
      await supabase
        .from("users")
        .update({ is_private: value })
        .eq("id", currentUserId);
    } catch (error) {
      setIsPrivate(!value);
    }
  };

  /**
   * Función para seguir o dejar de seguir a un usuario.
   */
  const toggleFollow = async () => {
    if (!currentUserId || !targetUid || isOwnProfile) return;

    try {
      if (followStatus === "following" || followStatus === "pending") {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUid);

        await supabase
          .from("notifications")
          .delete()
          .eq("actor_id", currentUserId)
          .eq("recipient_id", targetUid)
          .in("type", ["follow_request", "new_follower"]);

        setFollowStatus("none");
      } else {
        const { data: targetData } = await supabase
          .from("users")
          .select("is_private")
          .eq("id", targetUid)
          .single();

        const isReallyPrivate = targetData?.is_private || false;
        const finalStatus = isReallyPrivate ? "pending" : "accepted";

        await supabase.from("follows").insert([
          {
            follower_id: currentUserId,
            following_id: targetUid,
            status: finalStatus,
          },
        ]);

        await supabase.from("notifications").insert({
          recipient_id: targetUid,
          actor_id: currentUserId,
          type: finalStatus === "pending" ? "follow_request" : "new_follower",
        });

        setFollowStatus(finalStatus === "accepted" ? "following" : "pending");

        const { data: myUser } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();
        const myName = myUser?.username || t("social.someone");

        const title =
          finalStatus === "pending"
            ? t("social.notifications.newRequestTitle", { lng: targetLocale })
            : t("social.notifications.newFollowerTitle", { lng: targetLocale });

        const body =
          finalStatus === "pending"
            ? t("social.notifications.newRequestBody", {
                name: myName,
                lng: targetLocale,
              })
            : t("social.notifications.newFollowerBody", {
                name: myName,
                lng: targetLocale,
              });

        await sendPushNotificationViaEdgeFunction(targetUid, title, body);
      }
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Función para eliminar a un seguidor. Solo se activa si el usuario objetivo es el propio perfil (isOwnProfile) y el usuario a eliminar es un seguidor (theyFollowMe) para evitar que otros usuarios puedan eliminar seguidores ajenos o eliminar usuarios que no son seguidores.
   * @returns
   */
  const removeFollower = async () => {
    if (!currentUserId || !targetUid || isOwnProfile) return;
    try {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", targetUid)
        .eq("following_id", currentUserId);

      setTheyFollowMe(false);
      setFollowingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Función para obtener la lista de seguidores, siguiendo o solicitudes dependiendo del tipo solicitado. Solo se activa si hay un usuario objetivo (targetUid) para evitar consultas innecesarias.
   * @param type
   * @returns
   */
  const getSocialList = async (
    type: "followers" | "following" | "requests",
  ): Promise<SocialUser[]> => {
    if (!targetUid) return [];
    try {
      let query = supabase
        .from("follows")
        .select("status, follower_id, following_id");

      if (type === "followers") {
        query = query.eq("following_id", targetUid).eq("status", "accepted");
      } else if (type === "following") {
        query = query.eq("follower_id", targetUid).eq("status", "accepted");
      } else if (type === "requests") {
        query = query.eq("following_id", targetUid).eq("status", "pending");
      }

      const { data: followsData, error: followsError } = await query;
      if (followsError) throw followsError;
      if (!followsData || followsData.length === 0) return [];

      const userIds = followsData.map((f: any) =>
        type === "following" ? f.following_id : f.follower_id,
      );

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, profile_picture_url")
        .in("id", userIds);

      if (usersError) throw usersError;

      return usersData.map((u: any) => ({
        id: u.id,
        username: u.username,
        profilePictureUrl: u.profile_picture_url,
        status: followsData.find(
          (f: any) =>
            (type === "following" ? f.following_id : f.follower_id) === u.id,
        )?.status,
      })) as SocialUser[];
    } catch (error) {
      debugLog(`Error obteniendo ${type}:`, error);
      return [];
    }
  };

  /**
   * Función para manejar la aceptación o rechazo de una solicitud de seguimiento. Solo se activa si el usuario objetivo es el propio perfil (isOwnProfile) y la solicitud proviene de otro usuario (userIdToHandle) para evitar que otros usuarios puedan aceptar/rechazar solicitudes ajenas o aceptar/rechazar solicitudes inexistentes.
   * @param userIdToHandle
   * @param accept
   * @returns
   */
  const handleFollowRequest = async (
    userIdToHandle: string,
    accept: boolean,
  ) => {
    if (!currentUserId) return;

    setPendingRequestsCount((prev) => Math.max(0, prev - 1));

    try {
      if (accept) {
        await supabase
          .from("follows")
          .update({ status: "accepted" })
          .eq("follower_id", userIdToHandle)
          .eq("following_id", currentUserId);
        setHasPendingRequestFromThem(false);

        await supabase
          .from("notifications")
          .delete()
          .eq("recipient_id", currentUserId)
          .eq("actor_id", userIdToHandle)
          .eq("type", "follow_request");

        await supabase.from("notifications").insert({
          recipient_id: currentUserId,
          actor_id: userIdToHandle,
          type: "new_follower",
        });

        await supabase.from("notifications").insert({
          recipient_id: userIdToHandle,
          actor_id: currentUserId,
          type: "request_accepted",
        });

        const { data: myUser } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();
        const myName = myUser?.username || "Alguien";

        const { data: requestUser } = await supabase
          .from("users")
          .select("locale")
          .eq("id", userIdToHandle)
          .single();

        const recipientLang = requestUser?.locale || "es";

        await sendPushNotificationViaEdgeFunction(
          userIdToHandle,
          t("social.notifications.requestAcceptedTitle", {
            lng: recipientLang,
          }),
          t("social.notifications.requestAcceptedBody", {
            name: myName,
            lng: recipientLang,
          }),
        );
      } else {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userIdToHandle)
          .eq("following_id", currentUserId);

        await supabase
          .from("notifications")
          .delete()
          .eq("recipient_id", currentUserId)
          .eq("actor_id", userIdToHandle)
          .eq("type", "follow_request");

        setHasPendingRequestFromThem(false);
      }
    } catch (e) {
      setPendingRequestsCount((prev) => prev + 1);
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Función para cambiar el sistema de medición entre métrico e imperial. Convierte los valores de peso y altura al nuevo sistema seleccionado para mantener la coherencia de los datos. Solo se activa si es el propio perfil (isOwnProfile) para evitar que otros usuarios puedan cambiar el sistema de medición ajeno.
   * @param newSystem
   * @returns
   */
  const changeMeasurementSystem = (newSystem: "metric" | "imperial") => {
    if (newSystem === editMeasurementSystem) return;

    const currentWeight = parseFloat(editWeight.replace(",", "."));
    const currentHeight = parseFloat(editHeight.replace(",", "."));

    let newWeight = editWeight;
    let newHeight = editHeight;

    if (newSystem === "imperial") {
      if (!isNaN(currentWeight))
        newWeight = parseFloat((currentWeight * 2.20462).toFixed(1)).toString();
      if (!isNaN(currentHeight))
        newHeight = parseFloat(
          (currentHeight * 0.393701).toFixed(1),
        ).toString();
    } else {
      if (!isNaN(currentWeight))
        newWeight = parseFloat(
          (currentWeight * 0.453592).toFixed(1),
        ).toString();
      if (!isNaN(currentHeight))
        newHeight = parseFloat((currentHeight * 2.54).toFixed(1)).toString();
    }

    setEditWeight(newWeight);
    setEditHeight(newHeight);
    setEditMeasurementSystem(newSystem);
  };

  /**
   * Función para bloquear o desbloquear a un usuario. Si se bloquea, se eliminan las relaciones de seguimiento y cualquier rutina o weekly pack compartido entre ambos usuarios para evitar que el usuario bloqueado tenga acceso a contenido del bloqueador. Solo se activa si no es el propio perfil (isOwnProfile) para evitar que los usuarios puedan bloquearse a sí mismos.
   * @returns
   */
  const toggleBlock = async () => {
    if (!currentUserId || !targetUid) return;
    try {
      if (isBlocked) {
        await supabase
          .from("blocks")
          .delete()
          .eq("blocker_id", currentUserId)
          .eq("blocked_id", targetUid);
        setIsBlocked(false);
      } else {
        await supabase
          .from("blocks")
          .insert({ blocker_id: currentUserId, blocked_id: targetUid });
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUid);
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", targetUid)
          .eq("following_id", currentUserId);
        await supabase
          .from("routines")
          .delete()
          .eq("user_id", currentUserId)
          .eq("original_creator_id", targetUid);
        await supabase
          .from("routines")
          .delete()
          .eq("user_id", targetUid)
          .eq("original_creator_id", currentUserId);
        await supabase
          .from("weekly_packs")
          .delete()
          .eq("user_id", currentUserId)
          .eq("original_creator_id", targetUid);
        await supabase
          .from("weekly_packs")
          .delete()
          .eq("user_id", targetUid)
          .eq("original_creator_id", currentUserId);

        setIsBlocked(true);
        setFollowStatus("none");
        setTheyFollowMe(false);
      }
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Función para reportar a un usuario por comportamiento inapropiado. Inserta un nuevo reporte en la tabla "reports" con el ID del reportero, el ID del usuario reportado y el motivo del reporte. Solo se activa si hay un usuario objetivo (targetUid) para evitar reportes sin sentido.
   * @param reasonText
   * @returns
   */
  const reportUser = async (reasonText: string) => {
    if (!currentUserId || !targetUid) return;
    try {
      await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_id: targetUid,
        reason: reasonText || "Sin motivo especificado",
      });
      Alert.alert(t("profile.reportedTitle"), t("profile.reportedMsg"));
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Función para obtener la lista de usuarios bloqueados por el usuario actual. Llama a una función RPC personalizada en Supabase que devuelve los usuarios bloqueados para el usuario autenticado. Solo se activa si hay un usuario autenticado (currentUserId) para evitar consultas innecesarias.
   * @returns
   */
  const getBlockedUsersList = async () => {
    if (!currentUserId) return [];
    try {
      const { data, error } = await supabase.rpc("get_my_blocked_users");
      if (error) throw error;
      return data || [];
    } catch (error) {
      debugLog("Error al obtener bloqueados:", error);
      return [];
    }
  };

  /**
   * Función para desbloquear a un usuario desde la lista de bloqueados. Elimina el registro de bloqueo entre el usuario actual y el usuario a desbloquear. Solo se activa si hay un usuario autenticado (currentUserId) para evitar acciones sin sentido.
   * @param blockedId
   * @returns
   */
  const unblockUserFromList = async (blockedId: string) => {
    if (!currentUserId) return;
    await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", blockedId);
  };

  /**
   * Función para eliminar la cuenta del usuario. Llama a una función RPC personalizada en Supabase que elimina el usuario autenticado y toda su información relacionada de forma segura. Luego cierra la sesión del usuario. Solo se activa si hay un usuario autenticado (currentUserId) para evitar acciones sin sentido.
   * @returns
   */
  const deleteAccount = async () => {
    if (!currentUserId) return;
    try {
      await supabase.rpc("delete_user_account");
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  return {
    isLoading,
    isSaving,
    isEditing,
    openEditModal,
    username,
    profilePic: newProfilePic || profilePic,
    email,
    gender,
    measurementSystem,
    height,
    weight,
    isPrivate,
    togglePrivacy,
    bio,
    editUsername,
    setEditUsername,
    editHeight,
    setEditHeight,
    editWeight,
    setEditWeight,
    editBio,
    setEditBio,
    editMeasurementSystem,
    pickImage,
    handleSave,
    handleCancel,
    isOwnProfile,
    targetUid,
    followStatus,
    toggleFollow,
    theyFollowMe,
    removeFollower,
    followersCount,
    followingCount,
    pendingRequestsCount,
    hasPendingRequestFromThem,
    getSocialList,
    handleFollowRequest,
    changeMeasurementSystem,
    isBlocked,
    hasBlockedMe,
    toggleBlock,
    reportUser,
    getBlockedUsersList,
    unblockUserFromList,
    deleteAccount,
    refetchData,
  };
};

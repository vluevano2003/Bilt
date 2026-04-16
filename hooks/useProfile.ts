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
 * Función para enviar notificaciones push usando Expo Push API
 */
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

/**
 * Hook personalizado para manejar la lógica del perfil de usuario
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
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUid)
        .single();

      if (error || !data) {
        debugLog("Perfil no encontrado o bloqueado por RLS");
        setHasBlockedMe(true);
        setIsLoading(false);
        return;
      }

      if (data) {
        setUsername(data.username || "");
        setProfilePic(data.profile_picture_url || null);
        setEmail(data.email || "");
        setGender(data.gender || "");
        setMeasurementSystem(data.measurement_system || "metric");
        setHeight(data.height?.toString() || "");
        setWeight(data.weight?.toString() || "");
        setBio(data.bio || "");
        setIsPrivate(data.is_private || false);
      }
      setIsLoading(false);
    } catch (err) {
      setHasBlockedMe(true);
      setIsLoading(false);
    }
  }, [targetUid]);

  const fetchSocialStats = useCallback(async () => {
    if (!isOwnProfile) {
      const { data: myBlock } = await supabase
        .from("blocks")
        .select("*")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", targetUid)
        .single();
      setIsBlocked(!!myBlock);

      const { data: theirBlock } = await supabase
        .from("blocks")
        .select("*")
        .eq("blocker_id", targetUid)
        .eq("blocked_id", currentUserId)
        .single();
      setHasBlockedMe(!!theirBlock);
    }

    const { count: fCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUid)
      .eq("status", "accepted");
    setFollowersCount(fCount || 0);

    const { count: followingC } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUid)
      .eq("status", "accepted");
    setFollowingCount(followingC || 0);

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

      const { data: theirRequest } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", targetUid)
        .eq("following_id", currentUserId)
        .single();

      setHasPendingRequestFromThem(theirRequest?.status === "pending");
    }
  }, [targetUid, currentUserId, isOwnProfile]);

  useEffect(() => {
    if (!targetUid) return;

    fetchProfile();

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

    const followsChannel = supabase
      .channel(`follows-changes-${targetUid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        () => {
          fetchSocialStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(followsChannel);
    };
  }, [targetUid, currentUserId, isOwnProfile, fetchSocialStats]);

  const refetchData = async () => {
    await Promise.all([fetchProfile(), fetchSocialStats()]);
  };

  const openEditModal = () => {
    setEditUsername(username);
    setEditHeight(height);
    setEditWeight(weight);
    setEditBio(bio);
    setEditMeasurementSystem(measurementSystem);
    setNewProfilePic(null);
    setIsEditing(true);
  };

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
      debugLog("Error al guardar perfil:", error);

      if (error?.code === "23505") {
        Alert.alert(
          t("profile.alerts.usernameTakenTitle", "Nombre no disponible"),
          t(
            "profile.alerts.usernameTakenMsg",
            "Este nombre de usuario ya está en uso. Por favor, elige otro distinto.",
          ),
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
        setFollowStatus("none");
      } else {
        const { data: targetData } = await supabase
          .from("users")
          .select("is_private, push_token")
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
        setFollowStatus(finalStatus === "accepted" ? "following" : "pending");

        const { data: myUser } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();
        const myName = myUser?.username || "Alguien";

        if (targetData?.push_token) {
          const title =
            finalStatus === "pending"
              ? t("social.notifications.newRequestTitle")
              : t("social.notifications.newFollowerTitle");

          const body =
            finalStatus === "pending"
              ? t("social.notifications.newRequestBody", { name: myName })
              : t("social.notifications.newFollowerBody", { name: myName });

          await sendPushNotification(targetData.push_token, title, body);
        }
      }
    } catch (error) {
      Alert.alert(t("profile.alerts.error"), "No se pudo completar la acción.");
    }
  };

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

        const { data: myUser } = await supabase
          .from("users")
          .select("username")
          .eq("id", currentUserId)
          .single();
        const myName = myUser?.username || "Alguien";

        const { data: followerUser } = await supabase
          .from("users")
          .select("push_token")
          .eq("id", userIdToHandle)
          .single();

        if (followerUser?.push_token) {
          await sendPushNotification(
            followerUser.push_token,
            t("social.notifications.requestAcceptedTitle"),
            t("social.notifications.requestAcceptedBody", { name: myName }),
          );
        }
      } else {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userIdToHandle)
          .eq("following_id", currentUserId);
        setHasPendingRequestFromThem(false);
      }
    } catch (e) {
      setPendingRequestsCount((prev) => prev + 1);
      Alert.alert(
        t("profile.alerts.error"),
        "Ocurrió un problema procesando la solicitud.",
      );
    }
  };

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
        setIsBlocked(true);
        setFollowStatus("none");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        t("errors.unexpected", "No se pudo procesar la solicitud."),
      );
    }
  };

  const reportUser = async (reasonText: string) => {
    if (!currentUserId || !targetUid) return;
    try {
      await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_id: targetUid,
        reason: reasonText || "Sin motivo especificado",
      });
      Alert.alert(
        t("profile.reportedTitle", "Usuario Reportado"),
        t(
          "profile.reportedMsg",
          "Gracias por avisarnos. Revisaremos este perfil.",
        ),
      );
    } catch (error) {
      Alert.alert(
        "Error",
        t("errors.unexpected", "No se pudo reportar al usuario."),
      );
    }
  };

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

  const unblockUserFromList = async (blockedId: string) => {
    if (!currentUserId) return;
    await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", blockedId);
  };

  const deleteAccount = async () => {
    if (!currentUserId) return;
    try {
      await supabase.rpc("delete_user_account");
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert(
        "Error",
        t(
          "profile.deleteAccountError",
          "No se pudo eliminar la cuenta. Por favor contacta soporte.",
        ),
      );
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

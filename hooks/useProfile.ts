import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";

export interface SocialUser {
  id: string;
  username: string;
  profilePictureUrl?: string;
  status?: "pending" | "accepted";
}

/**
 * Función para enviar notificaciones push usando Expo Push API
 * @param expoPushToken
 * @param title
 * @param body
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
 * Hook personalizado para manejar la lógica del perfil de usuario, incluyendo edición, visualización y gestión de seguidores
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
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");

  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [measurementSystem, setMeasurementSystem] = useState<
    "metric" | "imperial"
  >("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [isPrivate, setIsPrivate] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [showWeight, setShowWeight] = useState(true);
  const [showHeight, setShowHeight] = useState(true);
  const [showGender, setShowGender] = useState(true);

  const [followStatus, setFollowStatus] = useState<
    "none" | "pending" | "following"
  >("none");
  const [hasPendingRequestFromThem, setHasPendingRequestFromThem] =
    useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const calculateAge = (dateString: string) => {
    if (!dateString) return "";
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const birth = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      );
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      return calculatedAge.toString();
    }
    return "";
  };

  useEffect(() => {
    if (!targetUid) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUid)
        .single();

      if (data) {
        setUsername(data.username || "");
        setProfilePic(data.profile_picture_url || null);
        setBirthDate(data.birth_date || "");
        setAge(calculateAge(data.birth_date));
        setEmail(data.email || "");
        setGender(data.gender || "");
        setMeasurementSystem(data.measurement_system || "metric");
        setHeight(data.height?.toString() || "");
        setWeight(data.weight?.toString() || "");
        setIsPrivate(data.is_private || false);
        setShowAge(data.show_age ?? true);
        setShowWeight(data.show_weight ?? true);
        setShowHeight(data.show_height ?? true);
        setShowGender(data.show_gender ?? true);
      }
      setIsLoading(false);
    };

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
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid || !currentUserId) return;

    const fetchSocialStats = async () => {
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
    };

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
  }, [targetUid, currentUserId, isOwnProfile]);

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

      const { error } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          profile_picture_url: profileUrl,
          measurement_system: measurementSystem,
          height: parseFloat(height.replace(",", ".")),
          weight: parseFloat(weight.replace(",", ".")),
          show_age: showAge,
          show_weight: showWeight,
          show_height: showHeight,
          show_gender: showGender,
        })
        .eq("id", currentUserId);

      if (error) throw error;

      setProfilePic(profileUrl);
      setNewProfilePic(null);
      setIsEditing(false);
      Alert.alert(t("profile.alerts.success"), t("profile.alerts.successSave"));
    } catch (error) {
      Alert.alert(t("profile.alerts.error"), t("profile.alerts.errorSave"));
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
      console.log(`Error obteniendo ${type}:`, error);
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
    if (newSystem === measurementSystem) return;

    const currentWeight = parseFloat(weight.replace(",", "."));
    const currentHeight = parseFloat(height.replace(",", "."));

    let newWeight = weight;
    let newHeight = height;

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
    setWeight(newWeight);
    setHeight(newHeight);
    setMeasurementSystem(newSystem);
  };

  return {
    isLoading,
    isSaving,
    isEditing,
    setIsEditing,
    username,
    setUsername,
    profilePic: newProfilePic || profilePic,
    age,
    email,
    gender,
    measurementSystem,
    setMeasurementSystem,
    height,
    setHeight,
    weight,
    setWeight,
    isPrivate,
    togglePrivacy,
    showAge,
    setShowAge,
    showWeight,
    setShowWeight,
    showHeight,
    setShowHeight,
    showGender,
    setShowGender,
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
  };
};

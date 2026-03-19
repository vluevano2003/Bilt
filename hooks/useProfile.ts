import * as ImagePicker from "expo-image-picker";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { auth, db, storage } from "../src/config/firebase";

export interface SocialUser {
  id: string;
  username: string;
  profilePictureUrl?: string;
  status?: "pending" | "accepted";
}

/**
 * Hook personalizado para manejar la lógica del perfil de usuario, incluyendo edición, visualización y gestión de seguidores.
 * Se ha modificado para usar onSnapshot y así reflejar cambios en tiempo real (ej. nombre de usuario).
 */
export const useProfile = (profileUid?: string) => {
  const { t } = useTranslation();
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

  const currentUserId = auth.currentUser?.uid;
  const targetUid = profileUid || currentUserId;
  const isOwnProfile = targetUid === currentUserId;

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

    const docRef = doc(db, "users", targetUid);

    const unsubscribeProfile = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || "");
          setProfilePic(data.profilePictureUrl || null);
          setBirthDate(data.birthDate || "");
          setAge(calculateAge(data.birthDate));
          setEmail(data.email || "");
          setGender(data.gender || "");
          setMeasurementSystem(data.measurementSystem || "metric");
          setHeight(data.height?.toString() || "");
          setWeight(data.weight?.toString() || "");

          setIsPrivate(data.isPrivate || false);
          setShowAge(data.showAge ?? true);
          setShowWeight(data.showWeight ?? true);
          setShowHeight(data.showHeight ?? true);
          setShowGender(data.showGender ?? true);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al obtener perfil en tiempo real:", error);
        Alert.alert(t("profile.alerts.error"), t("profile.alerts.errorLoad"));
        setIsLoading(false);
      },
    );

    return () => unsubscribeProfile();
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid || !currentUserId) return;

    const followersRef = collection(db, "users", targetUid, "followers");
    const unsubscribeFollowers = onSnapshot(followersRef, (snapshot) => {
      let accepted = 0;
      let pending = 0;
      snapshot.forEach((doc) => {
        if (doc.data().status === "accepted") accepted++;
        if (doc.data().status === "pending") pending++;
      });
      setFollowersCount(accepted);
      if (isOwnProfile) setPendingRequestsCount(pending);
    });

    const followingRef = collection(db, "users", targetUid, "following");
    const unsubscribeFollowingCount = onSnapshot(followingRef, (snapshot) => {
      let accepted = 0;
      snapshot.forEach((doc) => {
        if (doc.data().status === "accepted") accepted++;
      });
      setFollowingCount(accepted);
    });

    let unsubscribeFollowingStatus = () => {};
    let unsubscribeIncomingRequest = () => {};

    if (!isOwnProfile) {
      const myFollowingRef = doc(
        db,
        "users",
        currentUserId,
        "following",
        targetUid,
      );
      unsubscribeFollowingStatus = onSnapshot(myFollowingRef, (docSnap) => {
        if (docSnap.exists()) {
          const status = docSnap.data().status;
          setFollowStatus(status === "accepted" ? "following" : "pending");
        } else {
          setFollowStatus("none");
        }
      });

      const incomingRef = doc(
        db,
        "users",
        currentUserId,
        "followers",
        targetUid,
      );
      unsubscribeIncomingRequest = onSnapshot(incomingRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().status === "pending") {
          setHasPendingRequestFromThem(true);
        } else {
          setHasPendingRequestFromThem(false);
        }
      });
    }

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowingCount();
      unsubscribeFollowingStatus();
      unsubscribeIncomingRequest();
    };
  }, [targetUid, currentUserId, isOwnProfile]);

  const getSocialList = async (
    type: "followers" | "following" | "requests",
  ): Promise<SocialUser[]> => {
    if (!targetUid) return [];
    try {
      const queryType = type === "requests" ? "followers" : type;
      const listRef = collection(db, "users", targetUid, queryType);
      const snapshot = await getDocs(listRef);

      const userPromises = snapshot.docs.map(async (socialDoc) => {
        const status = socialDoc.data().status;

        if (type === "followers" && status !== "accepted") return null;
        if (type === "requests" && status !== "pending") return null;
        if (type === "following" && status !== "accepted") return null;

        const userDocRef = doc(db, "users", socialDoc.id);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          return {
            id: userSnap.id,
            username: userSnap.data().username,
            profilePictureUrl: userSnap.data().profilePictureUrl,
            status: status,
          } as SocialUser;
        }
        return null;
      });

      const users = await Promise.all(userPromises);
      return users.filter((u) => u !== null) as SocialUser[];
    } catch (error) {
      console.log(`Error obteniendo ${type}:`, error);
      return [];
    }
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
        const storageRef = ref(storage, `profile_pictures/${currentUserId}`);
        await uploadBytes(storageRef, blob);
        profileUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        username: username.trim(),
        profilePictureUrl: profileUrl,
        measurementSystem,
        height: parseFloat(height.replace(",", ".")),
        weight: parseFloat(weight.replace(",", ".")),
        showAge,
        showWeight,
        showHeight,
        showGender,
      });

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
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, { isPrivate: value });
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la privacidad");
      setIsPrivate(!value);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId || !targetUid || isOwnProfile) return;

    try {
      const myFollowingRef = doc(
        db,
        "users",
        currentUserId,
        "following",
        targetUid,
      );
      const theirFollowerRef = doc(
        db,
        "users",
        targetUid,
        "followers",
        currentUserId,
      );

      if (followStatus === "following" || followStatus === "pending") {
        await deleteDoc(myFollowingRef);
        await deleteDoc(theirFollowerRef);
        setFollowStatus("none");
      } else {
        const finalStatus = isPrivate ? "pending" : "accepted";
        await setDoc(myFollowingRef, {
          status: finalStatus,
          createdAt: new Date(),
        });
        await setDoc(theirFollowerRef, {
          status: finalStatus,
          createdAt: new Date(),
        });
        setFollowStatus(finalStatus === "accepted" ? "following" : "pending");
      }
    } catch (error) {
      console.log("Error al intentar seguir/dejar de seguir:", error);
      Alert.alert("Error", "No se pudo completar la acción. Intenta de nuevo.");
    }
  };

  const handleFollowRequest = async (
    userIdToHandle: string,
    accept: boolean,
  ) => {
    if (!currentUserId) return;
    try {
      const myFollowerRef = doc(
        db,
        "users",
        currentUserId,
        "followers",
        userIdToHandle,
      );
      const theirFollowingRef = doc(
        db,
        "users",
        userIdToHandle,
        "following",
        currentUserId,
      );

      if (accept) {
        await updateDoc(myFollowerRef, { status: "accepted" });
        await updateDoc(theirFollowingRef, { status: "accepted" });
        setHasPendingRequestFromThem(false);
      } else {
        await deleteDoc(myFollowerRef);
        await deleteDoc(theirFollowingRef);
        setHasPendingRequestFromThem(false);
      }
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema procesando la solicitud.");
    }
  };

  /**
   * Cambia el sistema de medición y convierte los valores de peso y altura al nuevo sistema
   * @param newSystem
   * @returns
   */
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
    getSocialList,
    handleFollowRequest,
    hasPendingRequestFromThem,
    changeMeasurementSystem,
  };
};

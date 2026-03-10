import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { auth, db, storage } from "../src/config/firebase";

export const useProfile = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");

  const [measurementSystem, setMeasurementSystem] = useState<
    "metric" | "imperial"
  >("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

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

  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username || "");
        setProfilePic(data.profilePictureUrl || null);
        setBirthDate(data.birthDate || "");
        setAge(calculateAge(data.birthDate));
        setMeasurementSystem(data.measurementSystem || "metric");
        setHeight(data.height?.toString() || "");
        setWeight(data.weight?.toString() || "");
      }
    } catch (error) {
      Alert.alert(t("profile.alerts.error"), t("profile.alerts.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const pickImage = async () => {
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
    if (!auth.currentUser) return;
    setIsSaving(true);

    try {
      let profileUrl = profilePic;

      if (newProfilePic) {
        const response = await fetch(newProfilePic);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `profile_pictures/${auth.currentUser.uid}`,
        );
        await uploadBytes(storageRef, blob);
        profileUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        profilePictureUrl: profileUrl,
        measurementSystem,
        height: parseFloat(height.replace(",", ".")),
        weight: parseFloat(weight.replace(",", ".")),
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
    fetchUserData();
    setIsEditing(false);
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
    measurementSystem,
    setMeasurementSystem,
    height,
    setHeight,
    weight,
    setWeight,
    pickImage,
    handleSave,
    handleCancel,
  };
};

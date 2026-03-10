import * as ImagePicker from "expo-image-picker";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform } from "react-native";
import { auth, db, storage } from "../src/config/firebase";
import {
  getFriendlyErrorMessage,
  isValidEmail,
} from "../src/utils/authHelpers";

export const useAuthForm = () => {
  const { t } = useTranslation();

  const [currentView, setCurrentView] = useState<
    "login" | "register" | "forgotPassword"
  >("login");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  const [measurementSystem, setMeasurementSystem] = useState<
    "metric" | "imperial"
  >("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setBirthDate(
        selectedDate.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      );
    } else {
      setShowDatePicker(false);
    }
  };

  const handleRegister = async () => {
    if (!height || !weight)
      return Alert.alert(t("alerts.missingData"), t("alerts.completeMetrics"));

    const parsedHeight = parseFloat(height.replace(",", "."));
    const parsedWeight = parseFloat(weight.replace(",", "."));

    if (isNaN(parsedHeight) || isNaN(parsedWeight))
      return Alert.alert(t("alerts.error"), t("alerts.mustBeNumbers"));

    if (measurementSystem === "metric") {
      if (parsedHeight < 50 || parsedHeight > 250)
        return Alert.alert(t("alerts.error"), t("alerts.unusualHeightCm"));
      if (parsedWeight < 20 || parsedWeight > 400)
        return Alert.alert(t("alerts.error"), t("alerts.unusualWeightKg"));
    } else {
      if (parsedHeight < 20 || parsedHeight > 100)
        return Alert.alert(t("alerts.error"), t("alerts.unusualHeightIn"));
      if (parsedWeight < 40 || parsedWeight > 900)
        return Alert.alert(t("alerts.error"), t("alerts.unusualWeightLbs"));
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      let profileUrl = null;

      if (profilePic) {
        const response = await fetch(profilePic);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `profile_pictures/${userCredential.user.uid}`,
        );
        await uploadBytes(storageRef, blob);
        profileUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: username.trim(),
        profilePictureUrl: profileUrl,
        birthDate,
        gender,
        height: parsedHeight,
        weight: parsedWeight,
        email: email.trim(),
        measurementSystem,
        createdAt: new Date(),
      });
    } catch (error: any) {
      Alert.alert(t("alerts.error"), getFriendlyErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert(
        t("alerts.emptyFields"),
        t("alerts.needEmailPassword"),
      );
    if (!isValidEmail(email))
      return Alert.alert(
        t("alerts.invalidEmailTitle"),
        t("alerts.invalidEmailFormat"),
      );

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      Alert.alert(t("alerts.error"), getFriendlyErrorMessage(error.code));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email)
      return Alert.alert(t("alerts.missingEmail"), t("alerts.writeEmail"));
    if (!isValidEmail(email))
      return Alert.alert(t("alerts.wrongFormatTitle"), t("alerts.includeAt"));

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(t("alerts.sent"), t("alerts.checkSpam"));
      setCurrentView("login");
      setPassword("");
    } catch (error: any) {
      Alert.alert(t("alerts.error"), getFriendlyErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!email || !password)
        return Alert.alert(
          t("alerts.incomplete"),
          t("alerts.enterEmailPassword"),
        );
      if (!isValidEmail(email))
        return Alert.alert(t("alerts.error"), t("alerts.invalidEmailTitle"));
      if (password.length < 6)
        return Alert.alert(t("alerts.error"), t("alerts.minChars"));
    }
    if (step === 2 && !username)
      return Alert.alert(t("alerts.error"), t("alerts.missingNickname"));
    if (step === 3) {
      if (!birthDate || !gender)
        return Alert.alert(t("alerts.error"), t("alerts.missingDateGender"));
      const age = new Date().getFullYear() - date.getFullYear();
      if (age < 13) return Alert.alert(t("alerts.error"), t("alerts.minAge"));
      if (age > 100)
        return Alert.alert(t("alerts.error"), t("alerts.checkYear"));
    }
    setStep(step + 1);
  };

  return {
    currentView,
    setCurrentView,
    step,
    setStep,
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    profilePic,
    birthDate,
    gender,
    setGender,
    measurementSystem,
    setMeasurementSystem,
    height,
    setHeight,
    weight,
    setWeight,
    date,
    showDatePicker,
    setShowDatePicker,
    pickImage,
    onChangeDate,
    handleRegister,
    handleLogin,
    handleForgotPassword,
    nextStep,
  };
};

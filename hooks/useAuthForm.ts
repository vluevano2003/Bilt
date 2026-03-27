import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";
import { isValidEmail } from "../src/utils/authHelpers";

/**
 * Hook personalizado para manejar la lógica de los formularios de autenticación (login, registro y recuperación de contraseña)
 * Centraliza el estado y las funciones relacionadas con la autenticación, validación de datos y manejo de errores
 * @returns
 */
export const useAuthForm = () => {
  const { t } = useTranslation();
  const { checkProfileStatus } = useAuth();

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
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return Alert.alert(t("alerts.error"), t("errors.networkFailed"));
    }

    if (!height || !weight)
      return Alert.alert(t("alerts.missingData"), t("alerts.completeMetrics"));

    const parsedHeight = parseFloat(height.replace(",", "."));
    const parsedWeight = parseFloat(weight.replace(",", "."));

    if (isNaN(parsedHeight) || isNaN(parsedWeight))
      return Alert.alert(t("alerts.error"), t("alerts.mustBeNumbers"));

    setIsLoading(true);
    try {
      let userId = "";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        userId = session.user.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: email.trim(),
            password: password,
          },
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear el usuario");
        userId = authData.user.id;
      }

      let profileUrl = profilePic;

      if (profilePic && !profilePic.startsWith("http")) {
        const response = await fetch(profilePic);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile_pictures")
          .upload(`${userId}/${Date.now()}.jpg`, arrayBuffer, {
            contentType: "image/jpeg",
          });

        if (uploadError) console.log("Error subiendo foto:", uploadError);

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("profile_pictures")
            .getPublicUrl(uploadData.path);
          profileUrl = publicUrlData.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from("users").insert([
        {
          id: userId,
          username: username.trim(),
          profile_picture_url: profileUrl,
          birth_date: birthDate,
          gender: gender,
          height: parsedHeight,
          weight: parsedWeight,
          email: email.trim(),
          measurement_system: measurementSystem,
        },
      ]);

      if (dbError) throw dbError;

      await checkProfileStatus(userId);
    } catch (error: any) {
      Alert.alert(t("alerts.error"), error.message || t("errors.unexpected"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return Alert.alert(t("alerts.error"), t("errors.networkFailed"));
    }

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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert(t("alerts.error"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return Alert.alert(t("alerts.error"), t("errors.networkFailed"));
    }

    if (!email)
      return Alert.alert(t("alerts.missingEmail"), t("alerts.writeEmail"));
    if (!isValidEmail(email))
      return Alert.alert(t("alerts.wrongFormatTitle"), t("alerts.includeAt"));
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      Alert.alert(t("alerts.sent"), t("alerts.checkSpam"));
      setCurrentView("login");
      setPassword("");
    } catch (error: any) {
      Alert.alert(t("alerts.error"), error.message);
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
    setProfilePic,
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

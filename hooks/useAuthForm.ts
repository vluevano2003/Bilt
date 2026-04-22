import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";
import { isValidEmail } from "../src/utils/authHelpers";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

/**
 * Custom hook para manejar la lógica de los formularios de autenticación (login, registro y recuperación de contraseña).
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

  const [forgotStep, setForgotStep] = useState(1);
  const [otpCode, setOtpCode] = useState("");
  const [newPasswordReset, setNewPasswordReset] = useState("");

  /**
   * Función para seleccionar una imagen de la galería del dispositivo y establecerla como foto de perfil.
   */
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

  /**
   * Función para manejar el cambio de fecha en el DatePicker. Establece la fecha seleccionada y formatea la fecha de nacimiento.
   * @param event
   * @param selectedDate
   */
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

  /**
   * Funciones para manejar el cambio en los campos de altura y peso, permitiendo solo números, puntos y comas. Esto asegura que los datos ingresados sean válidos para su posterior procesamiento.
   * @param text
   */
  const handleHeightChange = (text: string) => {
    setHeight(text.replace(/[^0-9.,]/g, ""));
  };

  /**
   * Función para manejar el cambio en el campo de peso, permitiendo solo números, puntos y comas. Esto asegura que los datos ingresados sean válidos para su posterior procesamiento.
   * @param text
   */
  const handleWeightChange = (text: string) => {
    setWeight(text.replace(/[^0-9.,]/g, ""));
  };

  /**
   * Función para manejar el registro de un nuevo usuario. Valida la conexión a internet, los datos ingresados (altura, peso, formato de email, etc.) y luego procede a crear la cuenta en Supabase. Si el usuario ya existe, se muestra un mensaje de error específico. También maneja la subida de la foto de perfil si se ha seleccionado una.
   * @returns
   */
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

    if (parsedHeight <= 0 || parsedWeight <= 0) {
      return Alert.alert(t("alerts.error"), t("alerts.noNegative"));
    }

    if (measurementSystem === "metric") {
      if (parsedHeight < 50 || parsedHeight > 300) {
        return Alert.alert(t("alerts.error"), t("alerts.unusualHeightCm"));
      }
      if (parsedWeight < 20 || parsedWeight > 600) {
        return Alert.alert(t("alerts.error"), t("alerts.unusualWeightKg"));
      }
    } else {
      if (parsedHeight < 20 || parsedHeight > 120) {
        return Alert.alert(t("alerts.error"), t("alerts.unusualHeightIn"));
      }
      if (parsedWeight < 40 || parsedWeight > 1300) {
        return Alert.alert(t("alerts.error"), t("alerts.unusualWeightLbs"));
      }
    }

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
        if (!authData.user) throw new Error(t("errors.userCreation"));
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

        if (uploadError) debugLog("Error subiendo foto:", uploadError);

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("profile_pictures")
            .getPublicUrl(uploadData.path);
          profileUrl = publicUrlData.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from("users").upsert({
        id: userId,
        username: username.trim(),
        profile_picture_url: profileUrl,
        birth_date: birthDate,
        gender: gender,
        height: parsedHeight,
        weight: parsedWeight,
        measurement_system: measurementSystem,
      });

      if (dbError) throw dbError;

      await checkProfileStatus(userId);
    } catch (error: any) {
      if (error?.code === "23505") {
        Alert.alert(
          t("profile.alerts.usernameTakenTitle"),
          t("profile.alerts.usernameTakenMsg"),
        );
      } else {
        Alert.alert(t("alerts.error"), error.message || t("errors.unexpected"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Función para manejar el login de un usuario existente. Valida la conexión a internet, los datos ingresados (formato de email, campos vacíos, etc.) y luego procede a autenticar al usuario en Supabase. Si ocurre algún error durante el proceso, se muestra un mensaje de error específico.
   * @returns
   */
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

  /**
   * Función para manejar el proceso de recuperación de contraseña. Valida la conexión a internet, el formato del email y luego envía una solicitud a Supabase para enviar un código OTP al correo del usuario. Si el proceso es exitoso, se muestra un mensaje indicando que el código ha sido enviado y se avanza al siguiente paso del proceso de recuperación. Si ocurre algún error, se muestra un mensaje de error específico.
   * @returns
   */
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

      Alert.alert(t("alerts.sent"), t("alerts.sentOtpCode"));
      setForgotStep(2);
    } catch (error: any) {
      Alert.alert(t("alerts.error"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Función para manejar la verificación del código OTP enviado al correo del usuario y el restablecimiento de la contraseña. Valida el formato del código OTP y la nueva contraseña, luego verifica el código con Supabase y, si es correcto, actualiza la contraseña del usuario. Si el proceso es exitoso, se muestra un mensaje indicando que la contraseña ha sido actualizada y se regresa a la pantalla de login. Si ocurre algún error, se muestra un mensaje de error específico.
   * @returns
   */
  const handleVerifyResetCode = async () => {
    if (!otpCode || otpCode.length !== 8)
      return Alert.alert(t("alerts.error"), t("alerts.invalidOtpCode"));
    if (newPasswordReset.length < 6)
      return Alert.alert(t("alerts.error"), t("alerts.minChars"));

    setIsLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "recovery",
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPasswordReset,
      });
      if (updateError) throw updateError;

      Alert.alert(t("profile.alerts.success"), t("login.passwordUpdated"));

      setForgotStep(1);
      setCurrentView("login");
      setPassword("");
      setOtpCode("");
      setNewPasswordReset("");
    } catch (error: any) {
      Alert.alert(t("alerts.error"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Función para avanzar al siguiente paso del proceso de registro. Valida los datos ingresados en cada paso (email, contraseña, username, fecha de nacimiento, género, etc.) y muestra mensajes de error específicos si los datos no cumplen con los requisitos. Si todos los datos son válidos, avanza al siguiente paso del formulario.
   * @returns
   */
  const nextStep = async () => {
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

    if (step === 2) {
      if (!username)
        return Alert.alert(t("alerts.error"), t("alerts.missingNickname"));

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("username", username.trim())
          .maybeSingle();

        if (data) {
          setIsLoading(false);
          return Alert.alert(
            t("profile.alerts.usernameTakenTitle"),
            t("profile.alerts.usernameTakenMsg"),
          );
        }
      } catch (error) {
        debugLog("Error verificando disponibilidad del username:", error);
      }
      setIsLoading(false);
    }

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
    setHeight: handleHeightChange,
    weight,
    setWeight: handleWeightChange,
    date,
    showDatePicker,
    setShowDatePicker,
    forgotStep,
    setForgotStep,
    otpCode,
    setOtpCode,
    newPasswordReset,
    setNewPasswordReset,
    pickImage,
    onChangeDate,
    handleRegister,
    handleLogin,
    handleForgotPassword,
    handleVerifyResetCode,
    nextStep,
  };
};

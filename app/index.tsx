import { AntDesign, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "../src/utils/Responsive";

import { useAuthForm } from "../hooks/useAuthForm";
import { CustomInput } from "../src/components/CustomInput";
import { GoogleSignInButton } from "../src/components/GoogleSignInButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/Login.styles";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      let backPressCount = 0;

      const onBackPress = () => {
        if (backPressCount === 1) {
          BackHandler.exitApp();
          return true;
        }

        backPressCount = 1;
        ToastAndroid.show(t("common.pressBackAgain"), ToastAndroid.SHORT);

        setTimeout(() => {
          backPressCount = 0;
        }, 2000);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [t]),
  );

  const {
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
  } = useAuthForm();

  const handleGoogleRegister = (userData: {
    email: string;
    name: string;
    photo: string;
  }) => {
    setEmail(userData.email);
    setUsername(
      userData.name ? userData.name.replace(/\s+/g, "").toLowerCase() : "",
    );
    if (userData.photo) setProfilePic(userData.photo);

    setCurrentView("register");
    setStep(2);
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language.includes("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
    try {
      await AsyncStorage.setItem("appLanguage", newLang);
    } catch (error) {
      debugError("Error saving language", error);
    }
  };

  const showOverlay = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
    >
      <View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
          right: scale(20),
          zIndex: 100,
          flexDirection: "row",
          gap: scale(10),
        }}
      >
        <TouchableOpacity
          style={{
            padding: moderateScale(10),
            backgroundColor: colors.surface,
            borderRadius: moderateScale(20),
            borderWidth: 1,
            borderColor: colors.border,
            width: scale(46),
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={toggleLanguage}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontWeight: "bold",
              fontSize: moderateScale(14),
            }}
          >
            {i18n.language.includes("es") ? "ES" : "EN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: moderateScale(10),
            backgroundColor: colors.surface,
            borderRadius: moderateScale(20),
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={() => toggleTheme()}
        >
          <Feather
            name={isDarkMode ? "sun" : "moon"}
            size={moderateScale(24)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + verticalScale(20) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.formContainer}>
          <Image
            source={
              isDarkMode
                ? require("../assets/images/logo_white_nobg.png")
                : require("../assets/images/logo_black_nobg.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t("login.title")}</Text>

          {currentView === "login" && (
            <>
              <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
              <CustomInput
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={{ width: "100%", position: "relative" }}>
                <CustomInput
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  style={{ paddingRight: scale(45) }}
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: scale(15),
                    top: 0,
                    bottom: verticalScale(15),
                    justifyContent: "center",
                  }}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Feather
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={moderateScale(20)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => setCurrentView("forgotPassword")}
              >
                <Text style={styles.forgotPasswordText}>
                  {t("login.forgotPassword")}
                </Text>
              </TouchableOpacity>
              <PrimaryButton
                title={t("login.loginButton")}
                onPress={handleLogin}
              />
              <GoogleSignInButton
                onRegisterRequired={handleGoogleRegister}
                onLoadingChange={setIsGoogleLoading}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => {
                  setCurrentView("register");
                  setStep(1);
                }}
              >
                <Text style={styles.toggleText}>{t("login.noAccount")}</Text>
              </TouchableOpacity>
            </>
          )}

          {currentView === "forgotPassword" && (
            <>
              {forgotStep === 1 ? (
                <View style={{ width: "100%" }}>
                  <Text style={styles.subtitle}>
                    {t("login.forgotSubtitle")}
                  </Text>
                  <Text style={styles.infoText}>{t("login.forgotInfo")}</Text>
                  <CustomInput
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <PrimaryButton
                    title={t("login.sendLink")}
                    onPress={handleForgotPassword}
                  />
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setCurrentView("login")}
                  >
                    <Text style={styles.toggleText}>
                      {t("login.backToLogin")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: "100%" }}>
                  <Text style={styles.subtitle}>
                    {t("login.verifyCodeTitle")}
                  </Text>
                  <Text
                    style={[
                      styles.infoText,
                      { marginBottom: verticalScale(15) },
                    ]}
                  >
                    {t("login.verifyCodeSubtitle")}
                  </Text>

                  <CustomInput
                    placeholder={t("login.codePlaceholder")}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={8}
                  />

                  <View style={{ width: "100%", position: "relative" }}>
                    <CustomInput
                      placeholder={t("login.newPasswordPlaceholder")}
                      value={newPasswordReset}
                      onChangeText={setNewPasswordReset}
                      secureTextEntry={!isPasswordVisible}
                      style={{ paddingRight: scale(45) }}
                    />
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        right: scale(15),
                        top: 0,
                        bottom: verticalScale(15),
                        justifyContent: "center",
                      }}
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <Feather
                        name={isPasswordVisible ? "eye" : "eye-off"}
                        size={moderateScale(20)}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <PrimaryButton
                    title={t("login.updatePasswordBtn")}
                    onPress={handleVerifyResetCode}
                  />
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setForgotStep(1)}
                  >
                    <Text style={styles.toggleText}>
                      {t("login.tryAnotherEmail")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {currentView === "register" && (
            <>
              <Text style={styles.subtitle}>
                {t("register.step", { step })}
              </Text>
              {step === 1 && (
                <View style={{ width: "100%" }}>
                  <CustomInput
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <View style={{ width: "100%", position: "relative" }}>
                    <CustomInput
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!isPasswordVisible}
                      style={{ paddingRight: scale(45) }}
                    />
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        right: scale(15),
                        top: 0,
                        bottom: verticalScale(15),
                        justifyContent: "center",
                      }}
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <Feather
                        name={isPasswordVisible ? "eye" : "eye-off"}
                        size={moderateScale(20)}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <PrimaryButton title={t("common.next")} onPress={nextStep} />

                  <GoogleSignInButton
                    onRegisterRequired={handleGoogleRegister}
                    onLoadingChange={setIsGoogleLoading}
                  />
                </View>
              )}
              {step === 2 && (
                <View style={{ width: "100%" }}>
                  <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={pickImage}
                  >
                    {profilePic ? (
                      <Image
                        source={{ uri: profilePic }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <AntDesign
                          name="camera"
                          size={moderateScale(32)}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.avatarText}>
                          {t("register.addPhoto")}
                        </Text>
                      </View>
                    )}
                    {profilePic && (
                      <View style={styles.editBadge}>
                        <AntDesign
                          name="edit"
                          size={moderateScale(14)}
                          color="#FFF"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                  <CustomInput
                    placeholder={t("register.usernamePlaceholder")}
                    value={username}
                    onChangeText={setUsername}
                  />
                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title={t("common.back")}
                      onPress={() => setStep(1)}
                      style={styles.halfInput}
                    />
                    <PrimaryButton
                      title={t("common.next")}
                      onPress={nextStep}
                      style={[
                        styles.halfInput,
                        { marginTop: verticalScale(10) },
                      ]}
                    />
                  </View>
                </View>
              )}
              {step === 3 && (
                <View style={{ width: "100%" }}>
                  <Text style={styles.label}>
                    {t("register.birthDateLabel")}
                  </Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={{
                        color: birthDate
                          ? colors.textPrimary
                          : colors.textSecondary,
                        fontSize: moderateScale(16),
                      }}
                    >
                      {birthDate || t("register.selectDate")}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <View>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        themeVariant={isDarkMode ? "dark" : "light"}
                      />
                      {Platform.OS === "ios" && (
                        <PrimaryButton
                          title={t("register.confirmDate")}
                          onPress={() => setShowDatePicker(false)}
                          style={{
                            padding: moderateScale(10),
                            marginTop: verticalScale(5),
                            marginBottom: verticalScale(15),
                          }}
                        />
                      )}
                    </View>
                  )}
                  <Text style={styles.label}>{t("register.genderLabel")}</Text>
                  <View style={styles.rowInputs}>
                    <TouchableOpacity
                      style={[
                        styles.selectableButton,
                        styles.halfInput,
                        gender === "Hombre" && styles.selectableButtonActive,
                      ]}
                      onPress={() => setGender("Hombre")}
                    >
                      <Text
                        style={[
                          styles.selectableText,
                          gender === "Hombre" && styles.selectableTextActive,
                        ]}
                      >
                        {t("register.male")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.selectableButton,
                        styles.halfInput,
                        gender === "Mujer" && styles.selectableButtonActive,
                      ]}
                      onPress={() => setGender("Mujer")}
                    >
                      <Text
                        style={[
                          styles.selectableText,
                          gender === "Mujer" && styles.selectableTextActive,
                        ]}
                      >
                        {t("register.female")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title={t("common.back")}
                      onPress={() => setStep(2)}
                      style={[
                        styles.halfInput,
                        { marginTop: verticalScale(20) },
                      ]}
                    />
                    <PrimaryButton
                      title={t("common.next")}
                      onPress={nextStep}
                      style={[
                        styles.halfInput,
                        { marginTop: verticalScale(20) },
                      ]}
                    />
                  </View>
                </View>
              )}
              {step === 4 && (
                <View style={{ width: "100%" }}>
                  <Text
                    style={[
                      styles.label,
                      { textAlign: "center", marginBottom: verticalScale(12) },
                    ]}
                  >
                    {t("register.systemLabel")}
                  </Text>
                  <View style={styles.segmentContainer}>
                    <TouchableOpacity
                      style={[
                        styles.segmentButton,
                        measurementSystem === "metric" &&
                          styles.segmentButtonActive,
                      ]}
                      onPress={() => setMeasurementSystem("metric")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          measurementSystem === "metric" &&
                            styles.segmentTextActive,
                        ]}
                      >
                        {t("register.metric")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentButton,
                        measurementSystem === "imperial" &&
                          styles.segmentButtonActive,
                      ]}
                      onPress={() => setMeasurementSystem("imperial")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          measurementSystem === "imperial" &&
                            styles.segmentTextActive,
                        ]}
                      >
                        {t("register.imperial")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.rowInputs}>
                    <CustomInput
                      placeholder={
                        measurementSystem === "metric"
                          ? t("register.heightCm")
                          : t("register.heightIn")
                      }
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                    <CustomInput
                      placeholder={
                        measurementSystem === "metric"
                          ? t("register.weightKg")
                          : t("register.weightLbs")
                      }
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                  </View>
                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title={t("common.back")}
                      onPress={() => setStep(3)}
                      style={styles.halfInput}
                    />
                    <PrimaryButton
                      title={t("common.finish")}
                      onPress={handleRegister}
                      style={[
                        styles.halfInput,
                        { marginTop: verticalScale(10) },
                      ]}
                    />
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setCurrentView("login")}
              >
                <Text style={styles.toggleText}>{t("login.hasAccount")}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* OVERLAY DE CARGA SIMPLIFICADO */}
      {showOverlay && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              elevation: 10,
            },
          ]}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

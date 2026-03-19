import { AntDesign, Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthForm } from "../hooks/useAuthForm";
import { CustomInput } from "../src/components/CustomInput";
import { GoogleSignInButton } from "../src/components/GoogleSignInButton";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/Login.styles";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);

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
  } = useAuthForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
    >
      <TouchableOpacity
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 50 : 40,
          right: 20,
          zIndex: 100,
          padding: 10,
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={() => toggleTheme()}
      >
        <Feather
          name={isDarkMode ? "sun" : "moon"}
          size={24}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
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

          {/* VISTA DE INICIO DE SESIÓN */}
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
              <CustomInput
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
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
                loading={isLoading}
              />
              <GoogleSignInButton />
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

          {/* VISTA DE RECUPERAR CONTRASEÑA */}
          {currentView === "forgotPassword" && (
            <>
              <Text style={styles.subtitle}>{t("login.forgotSubtitle")}</Text>
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
                loading={isLoading}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setCurrentView("login")}
              >
                <Text style={styles.toggleText}>{t("login.backToLogin")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* VISTA DE REGISTRO */}
          {currentView === "register" && (
            <>
              <Text style={styles.subtitle}>
                {t("register.step", { step })}
              </Text>

              {step === 1 && (
                <View>
                  <CustomInput
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <CustomInput
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <PrimaryButton title={t("common.next")} onPress={nextStep} />
                  <GoogleSignInButton />
                </View>
              )}

              {step === 2 && (
                <View>
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
                          size={32}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.avatarText}>
                          {t("register.addPhoto")}
                        </Text>
                      </View>
                    )}
                    {profilePic && (
                      <View style={styles.editBadge}>
                        <AntDesign name="edit" size={14} color="#FFF" />
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
                      style={[styles.halfInput, { marginTop: 10 }]}
                    />
                  </View>
                </View>
              )}

              {step === 3 && (
                <View>
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
                        fontSize: 16,
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
                            padding: 10,
                            marginTop: 5,
                            marginBottom: 15,
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
                      style={[styles.halfInput, { marginTop: 20 }]}
                    />
                    <PrimaryButton
                      title={t("common.next")}
                      onPress={nextStep}
                      style={[styles.halfInput, { marginTop: 20 }]}
                    />
                  </View>
                </View>
              )}

              {step === 4 && (
                <View>
                  <Text
                    style={[
                      styles.label,
                      { textAlign: "center", marginBottom: 12 },
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
                      loading={isLoading}
                      style={[styles.halfInput, { marginTop: 10 }]}
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
    </KeyboardAvoidingView>
  );
}

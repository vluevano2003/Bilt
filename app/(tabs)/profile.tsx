import { AntDesign } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile } from "../../hooks/useProfile";
import { CustomInput } from "../../src/components/CustomInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { auth } from "../../src/config/firebase";
import { colors } from "../../src/constants/theme";
import { styles } from "../../src/styles/ProfileScreen.styles";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const {
    isLoading,
    isSaving,
    isEditing,
    setIsEditing,
    username,
    setUsername,
    profilePic,
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
  } = useProfile();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.log("Error al cerrar sesión", error);
    }
  };

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* HEADER CON TÍTULO Y BOTÓN DE ENGRANAJE */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t("profile.title")}</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <AntDesign name="setting" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* FOTO DE PERFIL */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing}
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AntDesign name="user" size={40} color={colors.textSecondary} />
              </View>
            )}
            {isEditing && (
              <View style={styles.editBadge}>
                <AntDesign name="camera" size={14} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* EDAD */}
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>
              {age} {t("profile.years")}
            </Text>
          </View>

          {/* NOMBRE DE USUARIO */}
          <Text style={styles.label}>{t("profile.username")}</Text>
          <CustomInput
            value={username}
            onChangeText={setUsername}
            editable={isEditing}
            style={!isEditing && styles.readOnlyInput}
          />

          {/* SISTEMA DE MEDICIÓN */}
          <Text style={styles.label}>{t("profile.measurementSystem")}</Text>
          {isEditing ? (
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  measurementSystem === "metric" && styles.segmentButtonActive,
                ]}
                onPress={() => setMeasurementSystem("metric")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    measurementSystem === "metric" && styles.segmentTextActive,
                  ]}
                >
                  {t("profile.metric")}
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
                  {t("profile.imperial")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CustomInput
              value={
                measurementSystem === "metric"
                  ? t("profile.metric")
                  : t("profile.imperial")
              }
              editable={false}
              style={styles.readOnlyInput}
            />
          )}

          {/* ESTATURA Y PESO */}
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>
                {t("profile.height")} (
                {measurementSystem === "metric" ? "cm" : "in"})
              </Text>
              <CustomInput
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                editable={isEditing}
                style={!isEditing && styles.readOnlyInput}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>
                {t("profile.weight")} (
                {measurementSystem === "metric" ? "kg" : "lbs"})
              </Text>
              <CustomInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                editable={isEditing}
                style={!isEditing && styles.readOnlyInput}
              />
            </View>
          </View>

          {/* BOTONES DE EDICIÓN */}
          <View style={{ marginTop: 20 }}>
            {isEditing ? (
              <>
                <PrimaryButton
                  title={t("profile.saveChanges")}
                  onPress={handleSave}
                  loading={isSaving}
                />
                <SecondaryButton
                  title={t("profile.cancel")}
                  onPress={handleCancel}
                  disabled={isSaving}
                />
              </>
            ) : (
              <PrimaryButton
                title={t("profile.editProfile")}
                onPress={() => setIsEditing(true)}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE CONFIGURACIÓN */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile.settings")}</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Cambiar Idioma */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t("profile.language")}</Text>
              <View
                style={[
                  styles.segmentContainer,
                  { width: 140, marginBottom: 0 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    i18n.language.includes("es") && styles.segmentButtonActive,
                    { paddingVertical: 6 },
                  ]}
                  onPress={() => toggleLanguage("es")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      i18n.language.includes("es") && styles.segmentTextActive,
                    ]}
                  >
                    ES
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    i18n.language.includes("en") && styles.segmentButtonActive,
                    { paddingVertical: 6 },
                  ]}
                  onPress={() => toggleLanguage("en")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      i18n.language.includes("en") && styles.segmentTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cambiar Tema */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t("profile.darkMode")}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#FFF"}
              />
            </View>

            {/* Cerrar Sesión */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <AntDesign
                name="logout"
                size={20}
                color="#EF4444"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.logoutText}>{t("profile.logout")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

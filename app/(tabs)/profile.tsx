import { AntDesign, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SocialUser, useProfile } from "../../hooks/useProfile";
import { useUserActivity } from "../../hooks/useUserActivity";
import { CustomInput } from "../../src/components/CustomInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SocialListModal } from "../../src/components/ProfileModals";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { SettingsModal } from "../../src/components/SettingsModal";
import { supabase } from "../../src/config/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getStyles } from "../../src/styles/Profile.styles";
import { shareProfile } from "../../src/utils/shareHelpers";
import {
  calculateSessionVolume,
  formatDuration,
  getConvertedWeight,
} from "../../src/utils/workoutCalculations";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

/**
 * Pantalla de perfil de usuario donde se muestra la información del usuario, su historial de entrenamientos, seguidores y seguidos. Permite editar el perfil, cambiar configuraciones y compartir el perfil
 * @returns
 */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    isSaving,
    isEditing,
    setIsEditing,
    username,
    setUsername,
    profilePic,
    age,
    email,
    gender,
    measurementSystem,
    setMeasurementSystem,
    height,
    setHeight,
    weight,
    setWeight,
    pickImage,
    handleSave,
    handleCancel,
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
    followersCount,
    followingCount,
    getSocialList,
    changeMeasurementSystem,
    getBlockedUsersList,
    unblockUserFromList,
    deleteAccount,
  } = useProfile();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialModalType, setSocialModalType] = useState<
    "followers" | "following"
  >("followers");
  const [socialList, setSocialList] = useState<SocialUser[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const { userHistory, isLoadingActivity } = useUserActivity(user?.id);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      debugLog("Error logging out:", error);
    }
  };

  const handleDeletaAccount = () => {
    Alert.alert(
      t("profile.deleteAccountTitle", "Eliminar Cuenta"),
      t(
        "profile.deleteAccountMsg",
        "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.",
      ),
      [
        { text: t("common.cancel", "Cancelar"), style: "cancel" },
        {
          text: t("profile.deleteAccount", "Eliminar"),
          style: "destructive",
          onPress: deleteAccount,
        },
      ],
    );
  };

  const loadBlockedUsers = async () => {
    const list = await getBlockedUsersList();
    setBlockedUsers(list);
  };

  const handleUnblock = async (blockedId: string) => {
    await unblockUserFromList(blockedId);
    loadBlockedUsers();
  };

  const toggleLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem("appLanguage", lang);
    } catch (error) {
      debugLog("Error saving language", error);
    }
  };

  const openDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
  };

  const openSocialModal = async (type: "followers" | "following") => {
    setSocialModalType(type);
    setSocialModalVisible(true);
    setLoadingSocial(true);
    const users = await getSocialList(type);
    setSocialList(users);
    setLoadingSocial(false);
  };

  const getPublicDataString = () => {
    const data = [];
    if (showAge && age) data.push(`${age} ${t("profile.years")}`);
    if (showGender && gender) data.push(gender);
    if (showHeight && height)
      data.push(`${height} ${measurementSystem === "metric" ? "cm" : "in"}`);
    if (showWeight && weight)
      data.push(`${weight} ${measurementSystem === "metric" ? "kg" : "lbs"}`);
    return data.join(" • ");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingRight: 20,
                gap: 15,
              }}
            >
              <TouchableOpacity
                onPress={() => shareProfile(user?.id || "", username)}
              >
                <Feather name="share" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                <AntDesign
                  name="setting"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.formContainer}>
          <View style={[styles.centeredProfileInfo, { marginTop: 20 }]}>
            <View style={styles.avatarContainer}>
              {profilePic ? (
                <Image
                  source={{ uri: profilePic }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <AntDesign
                    name="user"
                    size={45}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.usernameText}>@{username}</Text>
            <View style={styles.socialStatsRow}>
              <TouchableOpacity
                style={styles.socialStatBox}
                onPress={() => openSocialModal("followers")}
              >
                <Text style={styles.socialStatNumber}>{followersCount}</Text>
                <Text style={styles.socialStatLabel}>
                  {t("profile.followers")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialStatBox}
                onPress={() => openSocialModal("following")}
              >
                <Text style={styles.socialStatNumber}>{followingCount}</Text>
                <Text style={styles.socialStatLabel}>
                  {t("profile.following")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.publicDataContainer}>
              <Text style={styles.publicDataText}>{getPublicDataString()}</Text>
            </View>
            <View style={{ width: "100%", marginTop: 10 }}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.actionButtonText}>
                  {t("profile.editProfile")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
            <Text
              style={[
                styles.label,
                { fontSize: 16, marginBottom: 15, marginLeft: 0 },
              ]}
            >
              {t("profile.workoutHistory")}
            </Text>
            {isLoadingActivity ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : userHistory.length > 0 ? (
              <>
                {userHistory.slice(0, historyLimit).map((session) => {
                  const durationMins = formatDuration(session.durationSeconds);
                  const totalVolume = calculateSessionVolume(
                    session,
                    measurementSystem,
                  );
                  const volumeUnit =
                    measurementSystem === "metric" ? "kg" : "lbs";
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.routineCard,
                        { flexDirection: "column", alignItems: "flex-start" },
                      ]}
                      onPress={() => openDetails(session)}
                    >
                      <Text style={styles.routineName}>
                        {session.routineName}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          width: "100%",
                          marginTop: 5,
                        }}
                      >
                        <Text style={styles.routineDetails}>
                          <Feather name="clock" size={12} /> {durationMins} min
                        </Text>
                        <Text style={styles.routineDetails}>
                          <Feather name="activity" size={12} /> {totalVolume}{" "}
                          {volumeUnit}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {userHistory.length > historyLimit && (
                  <TouchableOpacity
                    style={{
                      paddingVertical: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 20,
                    }}
                    onPress={() => setHistoryLimit((prev) => prev + 10)}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                      {t("profile.loadMore", "Cargar más entrenamientos")}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                {t("profile.noHistory")}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Editar Perfil */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { paddingBottom: Math.max(40, insets.bottom + 20) },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("profile.editProfile")}
                </Text>
                <TouchableOpacity onPress={handleCancel}>
                  <AntDesign
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
              >
                <TouchableOpacity
                  style={[styles.avatarContainer, { alignSelf: "center" }]}
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
                        name="user"
                        size={40}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <AntDesign name="camera" size={14} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.label}>{t("profile.username")}</Text>
                <CustomInput value={username} onChangeText={setUsername} />
                <Text style={styles.label}>
                  {t("profile.measurementSystem")}
                </Text>
                <View style={styles.formSegmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.formSegmentButton,
                      measurementSystem === "metric" &&
                        styles.formSegmentButtonActive,
                    ]}
                    onPress={() => changeMeasurementSystem("metric")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        measurementSystem === "metric" &&
                          styles.segmentTextActive,
                      ]}
                    >
                      {t("profile.metric")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.formSegmentButton,
                      measurementSystem === "imperial" &&
                        styles.formSegmentButtonActive,
                    ]}
                    onPress={() => changeMeasurementSystem("imperial")}
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
                    />
                  </View>
                </View>
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>{t("profile.gender")}</Text>
                    <CustomInput
                      value={gender}
                      editable={false}
                      style={styles.readOnlyInput}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>{t("profile.email")}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ width: "100%" }}
                    >
                      <CustomInput
                        value={email}
                        editable={false}
                        style={styles.readOnlyInput}
                      />
                    </ScrollView>
                  </View>
                </View>
                <Text
                  style={[styles.label, { marginTop: 15, marginBottom: 10 }]}
                >
                  {t("profile.visibilityOptions")}
                </Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t("profile.showAge")}
                  </Text>
                  <Switch
                    value={showAge}
                    onValueChange={setShowAge}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={"#FFF"}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t("profile.showGender")}
                  </Text>
                  <Switch
                    value={showGender}
                    onValueChange={setShowGender}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={"#FFF"}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t("profile.showHeight")}
                  </Text>
                  <Switch
                    value={showHeight}
                    onValueChange={setShowHeight}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={"#FFF"}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t("profile.showWeight")}
                  </Text>
                  <Switch
                    value={showWeight}
                    onValueChange={setShowWeight}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={"#FFF"}
                  />
                </View>
                <View style={{ marginTop: 25, gap: 10 }}>
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
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Configuración Pantalla Completa */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isPrivate={isPrivate}
        togglePrivacy={togglePrivacy}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        deleteAccount={handleDeletaAccount}
        getBlockedUsersList={getBlockedUsersList}
        unblockUserFromList={unblockUserFromList}
        t={t}
        i18n={i18n}
        toggleLanguage={toggleLanguage}
        colors={colors}
      />

      <SocialListModal
        visible={socialModalVisible}
        type={socialModalType}
        data={socialList}
        loading={loadingSocial}
        onClose={() => setSocialModalVisible(false)}
      />

      {/* MODAL DE HISTORIAL DETALLADO CORREGIDO */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(40, insets.bottom + 20) },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem?.routineName}</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginBottom: 20,
                  padding: 10,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  <Feather name="clock" size={16} />{" "}
                  {formatDuration(selectedItem?.durationSeconds)} min
                </Text>
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  <Feather name="activity" size={16} />{" "}
                  {calculateSessionVolume(selectedItem, measurementSystem)}{" "}
                  {measurementSystem === "metric" ? "kg" : "lbs"}
                </Text>
              </View>
              <Text style={[styles.label, { marginBottom: 10 }]}>
                {t("routines.exercises")}:
              </Text>
              {selectedItem?.exercises?.map((exercise: any, index: number) => {
                const exerciseName =
                  exercise.exerciseDetails?.id
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                  "Ejercicio";
                return (
                  <View
                    key={index}
                    style={{ marginBottom: 15, paddingLeft: 10 }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      • {exerciseName}
                    </Text>
                    {exercise.sets?.map((set: any, setIdx: number) => {
                      let displayUnit = "";
                      let displayWeight = set.weight;

                      if (
                        set.weightUnit === "bars" ||
                        set.weightUnit === "plates" ||
                        set.weightUnit === "bodyweight"
                      ) {
                        displayUnit = t(`unitSelection.${set.weightUnit}`);
                        if (
                          set.weightUnit === "bodyweight" &&
                          set.weight === 0
                        ) {
                          displayWeight = "";
                        } else if (
                          set.weightUnit === "bodyweight" &&
                          set.weight > 0
                        ) {
                          displayWeight = `+${set.weight}`;
                        }
                      } else {
                        displayWeight = Math.round(
                          getConvertedWeight(
                            set.weight,
                            set.weightUnit,
                            measurementSystem,
                          ),
                        );
                        displayUnit =
                          measurementSystem === "metric" ? "kg" : "lbs";
                      }

                      return (
                        <Text
                          key={setIdx}
                          style={{
                            color: colors.textSecondary,
                            marginLeft: 15,
                            fontSize: 14,
                          }}
                        >
                          Set {setIdx + 1}: {set.reps} reps{" "}
                          {set.weightUnit === "bodyweight" && set.weight === 0
                            ? "BW"
                            : `x ${displayWeight} ${displayUnit}`}
                        </Text>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

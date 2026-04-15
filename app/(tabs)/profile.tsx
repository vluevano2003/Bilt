import { AntDesign, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SocialUser, useProfile } from "../../hooks/useProfile";
import { useUserActivity } from "../../hooks/useUserActivity";
import { EditProfileModal } from "../../src/components/EditProfileModal";
import { SocialListModal } from "../../src/components/ProfileModals";
import { SettingsModal } from "../../src/components/SettingsModal";
import { WorkoutDetailsModal } from "../../src/components/WorkoutDetailsModal";
import { supabase } from "../../src/config/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getStyles } from "../../src/styles/Profile.styles";
import { shareProfile } from "../../src/utils/shareHelpers";
import {
  calculateSessionVolume,
  formatDuration,
} from "../../src/utils/workoutCalculations";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

/**
 * Pantalla de perfil del usuario. Muestra información del perfil, estadísticas sociales, historial de entrenamientos y permite editar el perfil, compartirlo, acceder a configuraciones y ver detalles de entrenamientos pasados.
 * @param param0
 * @returns
 */
const HeaderRightActions = ({ colors, styles, onShare, onSettings }: any) => (
  <View style={styles.headerRightActions}>
    <TouchableOpacity onPress={onShare}>
      <Feather name="share" size={22} color={colors.textPrimary} />
    </TouchableOpacity>
    <TouchableOpacity onPress={onSettings}>
      <AntDesign name="setting" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
  </View>
);

/**
 * Componente para mostrar la información principal del perfil, incluyendo avatar, nombre de usuario, bio y estadísticas de seguidores. También incluye el botón para editar el perfil y acceder a la lista de seguidores/seguidos.
 * @param param0
 * @returns
 */
const ProfileHeader = ({
  t,
  colors,
  styles,
  profilePic,
  username,
  followersCount,
  followingCount,
  bio,
  openSocialModal,
  openEditModal,
}: any) => (
  <View style={styles.centeredProfileInfo}>
    <View style={styles.avatarContainer}>
      {profilePic ? (
        <Image source={{ uri: profilePic }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <AntDesign name="user" size={45} color={colors.textSecondary} />
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
        <Text style={styles.socialStatLabel}>{t("profile.followers")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.socialStatBox}
        onPress={() => openSocialModal("following")}
      >
        <Text style={styles.socialStatNumber}>{followingCount}</Text>
        <Text style={styles.socialStatLabel}>{t("profile.following")}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.bioContainer}>
      <Text
        style={[
          styles.bioText,
          {
            color: bio ? colors.textPrimary : colors.textSecondary,
            fontStyle: bio ? "normal" : "italic",
          },
        ]}
      >
        {bio
          ? bio
          : t(
              "profile.addBioPrompt",
              "Agrega una breve presentación sobre ti.",
            )}
      </Text>
    </View>

    <View style={styles.actionButtonContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={openEditModal}>
        <Text style={styles.actionButtonText}>{t("profile.editProfile")}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * Componente para mostrar el historial de entrenamientos del usuario. Muestra una lista de entrenamientos con su duración, volumen total y fecha. Permite cargar más entrenamientos si hay más de los mostrados inicialmente. Al tocar un entrenamiento se abre un modal con los detalles completos.
 * @param param0
 * @returns
 */
const WorkoutHistoryList = ({
  t,
  i18n,
  colors,
  styles,
  userHistory,
  historyLimit,
  setHistoryLimit,
  isLoadingActivity,
  measurementSystem,
  openDetails,
}: any) => {
  if (isLoadingActivity) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  if (userHistory.length === 0) {
    return (
      <Text style={styles.emptyHistoryText}>{t("profile.noHistory")}</Text>
    );
  }

  return (
    <>
      {userHistory.slice(0, historyLimit).map((session: any) => {
        const durationMins = formatDuration(session.durationSeconds);
        const totalVolume = calculateSessionVolume(session, measurementSystem);
        const volumeUnit = measurementSystem === "metric" ? "kg" : "lbs";

        return (
          <TouchableOpacity
            key={session.id}
            style={[styles.routineCard, styles.historyCard]}
            onPress={() => openDetails(session)}
          >
            <Text style={styles.routineName}>{session.routineName}</Text>
            <Text style={styles.historyDateText}>
              {new Date(session.completedAt).toLocaleDateString(
                i18n.language.includes("es") ? "es-ES" : "en-US",
                {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}
            </Text>
            <View style={styles.historyStatsRow}>
              <Text style={styles.routineDetails}>
                <Feather name="clock" size={12} /> {durationMins} min
              </Text>
              <Text style={styles.routineDetails}>
                <Feather name="activity" size={12} /> {totalVolume} {volumeUnit}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
      {userHistory.length > historyLimit && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={() => setHistoryLimit((prev: number) => prev + 10)}
        >
          <Text style={styles.loadMoreText}>
            {t("profile.loadMore", "Cargar más entrenamientos")}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

/**
 * Pantalla de perfil del usuario. Muestra información del perfil, estadísticas sociales, historial de entrenamientos y permite editar el perfil, compartirlo, acceder a configuraciones y ver detalles de entrenamientos pasados.
 * @returns
 */
export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    isSaving,
    isEditing,
    openEditModal,
    username,
    profilePic,
    email,
    gender,
    measurementSystem,
    isPrivate,
    togglePrivacy,
    bio,
    editUsername,
    setEditUsername,
    editHeight,
    setEditHeight,
    editWeight,
    setEditWeight,
    editBio,
    setEditBio,
    editMeasurementSystem,
    pickImage,
    handleSave,
    handleCancel,
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

  const handleDeleteAccount = () => {
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
            <HeaderRightActions
              colors={colors}
              styles={styles}
              onShare={() => shareProfile(user?.id || "", username)}
              onSettings={() => setSettingsVisible(true)}
            />
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
          <ProfileHeader
            t={t}
            colors={colors}
            styles={styles}
            profilePic={profilePic}
            username={username}
            followersCount={followersCount}
            followingCount={followingCount}
            bio={bio}
            openSocialModal={openSocialModal}
            openEditModal={openEditModal}
          />

          <View style={styles.historySectionContainer}>
            <Text style={[styles.label, styles.historySectionTitle]}>
              {t("profile.workoutHistory")}
            </Text>
            <WorkoutHistoryList
              t={t}
              i18n={i18n}
              colors={colors}
              styles={styles}
              userHistory={userHistory}
              historyLimit={historyLimit}
              setHistoryLimit={setHistoryLimit}
              isLoadingActivity={isLoadingActivity}
              measurementSystem={measurementSystem}
              openDetails={openDetails}
            />
          </View>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={isEditing}
        onClose={handleCancel}
        isSaving={isSaving}
        handleSave={handleSave}
        pickImage={pickImage}
        profilePic={profilePic}
        editUsername={editUsername}
        setEditUsername={setEditUsername}
        editHeight={editHeight}
        setEditHeight={setEditHeight}
        editWeight={editWeight}
        setEditWeight={setEditWeight}
        gender={gender}
        email={email}
        editBio={editBio}
        setEditBio={setEditBio}
        editMeasurementSystem={editMeasurementSystem}
        changeMeasurementSystem={changeMeasurementSystem}
        colors={colors}
        styles={styles}
        t={t}
        insets={insets}
      />

      <WorkoutDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        selectedItem={selectedItem}
        measurementSystem={measurementSystem}
        colors={colors}
        styles={styles}
        t={t}
        insets={insets}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isPrivate={isPrivate}
        togglePrivacy={togglePrivacy}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        deleteAccount={handleDeleteAccount}
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
    </View>
  );
}

import { AntDesign, Feather, FontAwesome5 } from "@expo/vector-icons";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, verticalScale, scale } from "../../src/utils/Responsive";

import { SocialUser, useProfile } from "../../hooks/useProfile";
import { useAchievements, ACHIEVEMENTS_LIST } from "../../hooks/useAchievements";
import { useUserActivity } from "../../hooks/useUserActivity";
import { ClayCard } from "../../src/components/ClayCard";
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
      <Feather
        name="share"
        size={moderateScale(22)}
        color={colors.textPrimary}
      />
    </TouchableOpacity>
    <TouchableOpacity onPress={onSettings}>
      <AntDesign
        name="setting"
        size={moderateScale(24)}
        color={colors.textPrimary}
      />
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
  currentStreak,
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
          <AntDesign
            name="user"
            size={moderateScale(45)}
            color={colors.textSecondary}
          />
        </View>
      )}
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: -scale(10),
        backgroundColor: currentStreak > 0 ? '#f97316' : colors.surface,
        paddingHorizontal: scale(8),
        paddingVertical: scale(4),
        borderRadius: scale(12),
        borderWidth: 2,
        borderColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: currentStreak > 0 ? '#f97316' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: currentStreak > 0 ? 0.5 : 0.1,
        shadowRadius: 4,
        elevation: 4
      }}>
        <FontAwesome5 name="fire" size={scale(12)} color={currentStreak > 0 ? "#fff" : colors.textSecondary} />
        <Text style={{ color: currentStreak > 0 ? '#fff' : colors.textSecondary, fontWeight: 'bold', fontSize: scale(12), marginLeft: scale(4) }}>
          {currentStreak || 0}
        </Text>
      </View>
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
        {bio ? bio : t("profile.addBioPrompt")}
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
  userWeight,
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
        // Inferir el sistema de medición principal de la sesión para mostrar el volumen total en la unidad original
        let sessionSystem = measurementSystem;
        let foundSystem = false;
        session.exercises?.forEach((ex: any) => {
          if (!foundSystem) {
            ex.sets?.forEach((set: any) => {
              if (!foundSystem && (set.weightUnit === "kg" || set.weightUnit === "lbs")) {
                sessionSystem = set.weightUnit === "lbs" ? "imperial" : "metric";
                foundSystem = true;
              }
            });
          }
        });

        const totalVolume = calculateSessionVolume(
          session,
          sessionSystem,
          userWeight,
        );
        const volumeUnit = sessionSystem === "metric" ? "kg" : "lbs";

        return (
          <ClayCard
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
                <Feather name="clock" size={moderateScale(12)} /> {durationMins}{" "}
                min
              </Text>
              <Text style={styles.routineDetails}>
                <Feather name="activity" size={moderateScale(12)} />{" "}
                {totalVolume} {volumeUnit}
              </Text>
            </View>
          </ClayCard>
        );
      })}
      {userHistory.length > historyLimit && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={() => setHistoryLimit((prev: number) => prev + 10)}
        >
          <Text style={styles.loadMoreText}>{t("profile.loadMore")}</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

const AchievementsList = ({ achievements, loading, colors, styles, t, totalWorkouts, currentWeeklyStreak }: any) => {
  if (loading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: moderateScale(10) }}>
      {ACHIEVEMENTS_LIST.map((ach) => {
        const earned = achievements.find((a: any) => a.achievement_id === ach.id);
        
        return (
          <View key={ach.id} style={{ 
            width: '48%', 
            backgroundColor: colors.surface, 
            padding: moderateScale(12), 
            borderRadius: moderateScale(12), 
            marginBottom: verticalScale(15),
            alignItems: 'center',
            opacity: earned ? 1 : 0.5,
            borderWidth: 1,
            borderColor: earned ? colors.primary : colors.border
          }}>
            <View style={{ 
              width: moderateScale(50), 
              height: moderateScale(50), 
              borderRadius: moderateScale(25), 
              backgroundColor: earned ? ach.color + '20' : colors.background,
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: verticalScale(8)
            }}>
              {ach.icon === "fire" ? (
                <FontAwesome5 name="fire" size={moderateScale(24)} color={earned ? ach.color : colors.textSecondary} />
              ) : (
                <Feather name={ach.icon as any || "award"} size={moderateScale(24)} color={earned ? ach.color : colors.textSecondary} />
              )}
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: moderateScale(12), textAlign: 'center', marginBottom: verticalScale(4) }}>
              {t(ach.titleKey)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: moderateScale(10), textAlign: 'center', marginBottom: earned ? verticalScale(4) : 0 }}>
              {t(ach.descKey)}
            </Text>
            {earned && (
              <Text style={{ color: colors.primary, fontSize: moderateScale(10), textAlign: 'center', fontWeight: 'bold' }}>
                ✓ {new Date(earned.earned_at).toLocaleDateString()}
              </Text>
            )}
            {!earned && (
              <Text style={{ color: colors.textSecondary, fontSize: moderateScale(10), textAlign: 'center', marginTop: verticalScale(4), fontWeight: 'bold' }}>
                {ach.id.startsWith("workouts_") ? `${Math.min(totalWorkouts, parseInt(ach.id.split("_")[1]))} / ${ach.id.split("_")[1]}` : ach.id.startsWith("streak_") ? `${Math.min(currentWeeklyStreak, parseInt(ach.id.split("_")[1]))} / ${ach.id.split("_")[1]}` : ""}
              </Text>
            )}
          </View>
        );
      })}
    </View>
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
    currentStreak,
    currentWeeklyStreak,
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
    weight,
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
    updateMeasurementSystem,
    getBlockedUsersList,
    unblockUserFromList,
    deleteAccount,
    refetchData,
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
  const [activeTab, setActiveTab] = useState<"history" | "achievements">("history");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { achievements, loading: achievementsLoading, refetchAchievements } = useAchievements(user?.id);

  /**
   * Función para refrescar los datos del perfil y el historial de entrenamientos. Se llama al hacer pull-to-refresh en la lista de historial. Refresca tanto la información del perfil como el historial de actividades.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchData(), refetchAchievements()]);
    setRefreshing(false);
  }, [refetchData, refetchAchievements]);

  /**
   * Función para cerrar sesión del usuario. Llama a la función de signOut de Supabase y maneja cualquier error que pueda ocurrir durante el proceso. Se llama al seleccionar "Cerrar sesión" en el modal de configuraciones.
   */
  const handleLogout = async () => {
    try {
      setSettingsVisible(false);
      setIsLoggingOut(true);
      if (user?.id) {
        await supabase.from("users").update({ push_token: null }).eq("id", user.id);
      }
      await supabase.auth.signOut();
    } catch (error) {
      debugLog("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  /**
   * Función para eliminar la cuenta del usuario. Muestra una alerta de confirmación antes de proceder con la eliminación. Si el usuario confirma, se llama a la función deleteAccount que maneja la lógica de eliminación de la cuenta. Se llama al seleccionar "Eliminar cuenta" en el modal de configuraciones.
   */
  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccountTitle"),
      t("profile.deleteAccountMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccount"),
          style: "destructive",
          onPress: deleteAccount,
        },
      ],
    );
  };

  /**
   * Función para cambiar el idioma de la aplicación. Cambia el idioma usando i18n y guarda la selección en AsyncStorage para que se mantenga en futuras sesiones. Se llama al seleccionar un nuevo idioma en el modal de configuraciones.
   * @param lang
   */
  const toggleLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem("appLanguage", lang);
    } catch (error) {
      debugLog("Error saving language", error);
    }
  };

  /**
   * Función para abrir el modal de detalles de un entrenamiento. Recibe el entrenamiento seleccionado como parámetro, lo guarda en el estado y muestra el modal con los detalles completos del entrenamiento. Se llama al tocar un entrenamiento en la lista de historial.
   * @param item
   */
  const openDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
  };

  /**
   * Función para abrir el modal de lista social (seguidores o seguidos). Recibe el tipo de lista a mostrar ("followers" o "following"), carga la lista correspondiente desde la función getSocialList, guarda los datos en el estado y muestra el modal con la lista de usuarios. Se llama al tocar las estadísticas de seguidores o seguidos en el perfil.
   * @param type
   */
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
          { paddingBottom: insets.bottom + verticalScale(20) },
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
            currentStreak={currentStreak}
            bio={bio}
            openSocialModal={openSocialModal}
            openEditModal={openEditModal}
          />

          <View style={styles.historySectionContainer}>
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: verticalScale(15), borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <TouchableOpacity onPress={() => setActiveTab("history")} style={{ paddingBottom: verticalScale(8), borderBottomWidth: 2, borderBottomColor: activeTab === "history" ? colors.primary : "transparent" }}>
                <Text style={[styles.label, { color: activeTab === "history" ? colors.primary : colors.textSecondary }]}>{t("profile.workoutHistory")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab("achievements")} style={{ paddingBottom: verticalScale(8), borderBottomWidth: 2, borderBottomColor: activeTab === "achievements" ? colors.primary : "transparent" }}>
                <Text style={[styles.label, { color: activeTab === "achievements" ? colors.primary : colors.textSecondary }]}>{t("profile.achievements", { defaultValue: "Logros" })}</Text>
              </TouchableOpacity>
            </View>

            {activeTab === "history" ? (
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
                userWeight={weight}
                openDetails={openDetails}
              />
            ) : (
              <AchievementsList 
                 achievements={achievements} 
                 loading={achievementsLoading} 
                 colors={colors} 
                 styles={styles} 
                 t={t}
                 totalWorkouts={new Set(userHistory.map((s: any) => new Date(s.completedAt).toDateString())).size}
                 currentWeeklyStreak={currentWeeklyStreak}
              />
            )}
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
        measurementSystem={measurementSystem}
        updateMeasurementSystem={updateMeasurementSystem}
      />

      <SocialListModal
        visible={socialModalVisible}
        type={socialModalType}
        data={socialList}
        loading={loadingSocial}
        onClose={() => setSocialModalVisible(false)}
      />
      
      {isLoggingOut && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 1000 }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

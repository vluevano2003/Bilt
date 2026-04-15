import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SocialUser, useProfile } from "../hooks/useProfile";
import { useProfileActions } from "../hooks/useProfileActions";
import { useUserActivity } from "../hooks/useUserActivity";
import { WeeklyPack } from "../hooks/useWeeklyPacks";
import {
  ItemDetailsModal,
  PackDetailsModal,
  SocialListModal,
} from "../src/components/ProfileModals";
import {
  EmptyState,
  SegmentedTabs,
  TopNavigationBar,
  UserInfoCard,
} from "../src/components/UserProfileUI";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/Profile.styles";
import {
  calculateTotalVolume,
  formatDuration,
} from "../src/utils/profileHelpers";
import { shareProfile } from "../src/utils/shareHelpers";

/**
 * Pantalla de perfil de usuario. Muestra la información del usuario, sus rutinas, historial y packs semanales.
 * @returns
 */
export default function UserProfileScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const profileId = params.id as string | undefined;
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();
  const styles = getStyles(colors);

  const profile = useProfile(profileId);
  const { userRoutines, userHistory, userPacks, isLoadingActivity } =
    useUserActivity(profileId);
  const actions = useProfileActions(profileId, profile.username, userRoutines);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeTab, setActiveTab] = useState<"routines" | "history" | "packs">(
    "routines",
  );
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialModalType, setSocialModalType] = useState<
    "followers" | "following"
  >("followers");
  const [socialList, setSocialList] = useState<SocialUser[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsType, setDetailsType] = useState<"routine" | "history">(
    "routine",
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [packDetailsVisible, setPackDetailsVisible] = useState(false);
  const [selectedPack, setSelectedPack] = useState<WeeklyPack | null>(null);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile.isLoading && profile.isOwnProfile) {
      router.replace("/(tabs)/profile");
    }
  }, [profile.isLoading, profile.isOwnProfile]);

  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, []);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleToggleBlock = () => {
    setOptionsModalVisible(false);
    Alert.alert(
      profile.isBlocked
        ? t("profile.unblockConfirmTitle", "Desbloquear")
        : t("profile.blockConfirmTitle", "Bloquear"),
      profile.isBlocked
        ? t("profile.unblockMsg", "¿Quieres desbloquear a este usuario?")
        : t(
            "profile.blockMsg",
            "¿Estás seguro de bloquear a este usuario? No podrán ver tu perfil ni interactuar.",
          ),
      [
        { text: t("common.cancel", "Cancelar"), style: "cancel" },
        {
          text: t("common.confirm", "Confirmar"),
          style: "destructive",
          onPress: profile.toggleBlock,
        },
      ],
    );
  };

  const handleSendReport = () => {
    profile.reportUser(reportReason);
    setReportModalVisible(false);
    setReportReason("");
  };

  const openSocialModal = async (type: "followers" | "following") => {
    if (!showContent) return;
    setSocialModalType(type);
    setSocialModalVisible(true);
    setLoadingSocial(true);
    const users = await profile.getSocialList(type);
    setSocialList(users);
    setLoadingSocial(false);
  };

  const handleToggleFollow = () => {
    if (profile.isPrivate && profile.followStatus === "following") {
      Alert.alert(
        t("social.unfollowPrivateTitle"),
        t("social.unfollowPrivateMsg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("social.unfollowConfirm"),
            style: "destructive",
            onPress: () => profile.toggleFollow(),
          },
        ],
      );
    } else {
      profile.toggleFollow();
    }
  };

  if (profile.isLoading || profile.isOwnProfile) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isProfileNotFound = !profile.isLoading && !profile.username;

  if (isProfileNotFound) {
    return (
      <View style={styles.container}>
        <TopNavigationBar
          colors={colors}
          styles={styles}
          insets={insets}
          onBack={handleGoBack}
          showActions={false}
        />
        <EmptyState
          styles={styles}
          colors={colors}
          icon="user-x"
          title={t("profile.userNotFoundTitle", "Usuario no encontrado")}
          message={t(
            "profile.userNotFoundMsg",
            "Es posible que el enlace sea incorrecto o que el usuario haya eliminado su cuenta.",
          )}
          actionButton={
            <TouchableOpacity
              style={[styles.actionButton, styles.emptyStateActionBtn]}
              onPress={handleGoBack}
            >
              <Text style={[styles.actionButtonText, styles.buttonTextWhite]}>
                {t("common.backToHome", "Volver al inicio")}
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  const isUnavailable = profile.isBlocked || profile.hasBlockedMe;
  const showContent =
    !isUnavailable &&
    (profile.isOwnProfile ||
      !profile.isPrivate ||
      profile.followStatus === "following");

  const displayedUserRoutines = userRoutines.filter(
    (r: any) => !r.originalCreatorId,
  );
  const displayedUserPacks = userPacks.filter((p: any) => !p.originalCreatorId);

  return (
    <View style={styles.container}>
      <TopNavigationBar
        colors={colors}
        styles={styles}
        insets={insets}
        onBack={handleGoBack}
        showActions={!isUnavailable}
        onShare={() => shareProfile(profileId || "", profile.username)}
        onOptions={() => setOptionsModalVisible(true)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 100 },
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
          {isUnavailable ? (
            <EmptyState
              styles={styles}
              colors={colors}
              icon="user-x"
              title={t("profile.userBlockedTitle", "Usuario no disponible")}
              message={t(
                "profile.userNotFoundMsg",
                "Es posible que el enlace sea incorrecto o que el usuario haya eliminado su cuenta.",
              )}
            />
          ) : (
            <>
              <UserInfoCard
                t={t}
                colors={colors}
                styles={styles}
                profile={profile}
                profileId={profileId}
                openSocialModal={openSocialModal}
                handleToggleFollow={handleToggleFollow}
              />

              {!showContent ? (
                <View style={styles.privateContainer}>
                  <Feather name="lock" size={50} color={colors.textSecondary} />
                  <Text style={styles.privateTitle}>
                    {t("profile.privateAccount")}
                  </Text>
                  <Text style={styles.privateText}>
                    {t("profile.privateMsg")}
                  </Text>
                </View>
              ) : (
                <>
                  <SegmentedTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    styles={styles}
                    colors={colors}
                  />

                  <View style={{ paddingHorizontal: 20 }}>
                    {isLoadingActivity ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : activeTab === "routines" ? (
                      displayedUserRoutines.length > 0 ? (
                        displayedUserRoutines.map((routine: any) => (
                          <View key={routine.id} style={styles.routineCard}>
                            <TouchableOpacity
                              style={styles.routineInfo}
                              onPress={() => {
                                setSelectedItem(routine);
                                setDetailsType("routine");
                                setDetailsModalVisible(true);
                              }}
                            >
                              <Text style={styles.routineName}>
                                {routine.name}
                              </Text>
                              <Text style={styles.routineDetails}>
                                {routine.exercises?.length || 0}{" "}
                                {t("routines.exercises")}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.bookmarkBtn}
                              onPress={() =>
                                actions.handleToggleSaveRoutine(routine)
                              }
                            >
                              <FontAwesome
                                name={
                                  !!actions.getSavedRoutineId(routine.id)
                                    ? "bookmark"
                                    : "bookmark-o"
                                }
                                size={22}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyHistoryText}>
                          {t("profile.noPublicRoutines")}
                        </Text>
                      )
                    ) : activeTab === "packs" ? (
                      displayedUserPacks.length > 0 ? (
                        displayedUserPacks.map((pack: any) => (
                          <TouchableOpacity
                            key={pack.id}
                            style={styles.routineCard}
                            onPress={() => {
                              setSelectedPack(pack);
                              setPackDetailsVisible(true);
                            }}
                          >
                            <View style={styles.routineInfo}>
                              <Text style={styles.routineName}>
                                {pack.name}
                              </Text>
                              <Text style={styles.routineDetails}>
                                {pack.routineIds.length}{" "}
                                {t("routines.exercises", "Rutinas")}
                              </Text>
                            </View>
                            <Feather
                              name="chevron-right"
                              size={22}
                              color={colors.textSecondary}
                            />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.emptyHistoryText}>
                          {t(
                            "weeklyPacks.noPublicPacks",
                            "Este usuario aún no tiene Packs Semanales.",
                          )}
                        </Text>
                      )
                    ) : userHistory.length > 0 ? (
                      <>
                        {userHistory
                          .slice(0, historyLimit)
                          .map((session: any) => (
                            <TouchableOpacity
                              key={session.id}
                              style={[styles.routineCard, styles.historyCard]}
                              onPress={() => {
                                setSelectedItem(session);
                                setDetailsType("history");
                                setDetailsModalVisible(true);
                              }}
                            >
                              <Text style={styles.routineName}>
                                {session.routineName}
                              </Text>
                              <Text style={styles.historyDateText}>
                                {new Date(
                                  session.completedAt,
                                ).toLocaleDateString(
                                  i18n.language.includes("es")
                                    ? "es-ES"
                                    : "en-US",
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </Text>
                              <View style={styles.routineDetailsRow}>
                                <Text style={styles.routineStatText}>
                                  <Feather name="clock" size={12} />{" "}
                                  {formatDuration(session.durationSeconds)} min
                                </Text>
                                <Text style={styles.routineStatText}>
                                  <Feather name="activity" size={12} />{" "}
                                  {calculateTotalVolume(
                                    session,
                                    profile.measurementSystem,
                                  )}{" "}
                                  {profile.measurementSystem === "metric"
                                    ? "kg"
                                    : "lbs"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        {userHistory.length > historyLimit && (
                          <TouchableOpacity
                            style={styles.loadMoreBtn}
                            onPress={() => setHistoryLimit((prev) => prev + 10)}
                          >
                            <Text style={styles.loadMoreText}>
                              {t(
                                "profile.loadMore",
                                "Cargar más entrenamientos",
                              )}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <Text style={styles.emptyHistoryText}>
                        {t("profile.noHistory")}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal de Opciones */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsModalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.optionsModalContent,
                  { paddingBottom: Math.max(20, insets.bottom + 10) },
                ]}
              >
                <View style={styles.optionsModalHandle} />

                <TouchableOpacity
                  style={styles.optionsModalRow}
                  onPress={() => {
                    setOptionsModalVisible(false);
                    setReportModalVisible(true);
                  }}
                >
                  <Feather
                    name="flag"
                    size={22}
                    color="#EF4444"
                    style={styles.optionsModalIcon}
                  />
                  <Text style={styles.optionsModalTextDanger}>
                    {t("profile.report", "Reportar usuario")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionsModalRow}
                  onPress={handleToggleBlock}
                >
                  <Feather
                    name="slash"
                    size={22}
                    color="#EF4444"
                    style={styles.optionsModalIcon}
                  />
                  <Text style={styles.optionsModalTextDanger}>
                    {profile.isBlocked
                      ? t("profile.unblock", "Desbloquear usuario")
                      : t("profile.block", "Bloquear usuario")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionsModalRowBorder}
                  onPress={() => setOptionsModalVisible(false)}
                >
                  <Feather
                    name="x"
                    size={22}
                    color={colors.textPrimary}
                    style={styles.optionsModalIcon}
                  />
                  <Text style={styles.optionsModalText}>
                    {t("common.cancel", "Cancelar")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Reporte */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.reportModalOverlay}>
            <View style={styles.reportModalContent}>
              <View style={styles.reportModalHeader}>
                <Text style={styles.reportModalTitle}>
                  {t("profile.reportConfirmTitle", "Reportar Usuario")}
                </Text>
                <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                  <AntDesign
                    name="close"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.reportReasonPrompt}>
                {t(
                  "profile.reportReasonPrompt",
                  "¿Por qué quieres reportar a este usuario? Por favor detalla el motivo.",
                )}
              </Text>

              <TextInput
                style={styles.reportInput}
                placeholderTextColor={colors.textSecondary}
                placeholder={t(
                  "profile.reportReasonPlaceholder",
                  "Escribe el motivo...",
                )}
                multiline
                value={reportReason}
                onChangeText={setReportReason}
              />

              <TouchableOpacity
                style={[
                  styles.reportSubmitBtn,
                  {
                    backgroundColor:
                      reportReason.trim().length > 0
                        ? "#EF4444"
                        : colors.border,
                  },
                ]}
                disabled={reportReason.trim().length === 0}
                onPress={handleSendReport}
              >
                <Text style={styles.reportSubmitText}>
                  {t("profile.sendReport", "Enviar Reporte")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SocialListModal
        visible={socialModalVisible}
        type={socialModalType}
        data={socialList}
        loading={loadingSocial}
        onClose={() => setSocialModalVisible(false)}
      />
      <PackDetailsModal
        visible={packDetailsVisible}
        pack={selectedPack}
        userRoutines={userRoutines}
        isSaving={actions.isSavingFullPack}
        isSaved={!!actions.getSavedPackId(selectedPack?.id || "")}
        onToggleSave={() =>
          actions.handleToggleSavePack(selectedPack, () =>
            setPackDetailsVisible(false),
          )
        }
        onClose={() => setPackDetailsVisible(false)}
      />
      <ItemDetailsModal
        visible={detailsModalVisible}
        type={detailsType}
        item={selectedItem}
        isSaved={!!actions.getSavedRoutineId(selectedItem?.id)}
        system={profile.measurementSystem}
        onToggleSave={() =>
          actions.handleToggleSaveRoutine(selectedItem, () =>
            setDetailsModalVisible(false),
          )
        }
        onClose={() => setDetailsModalVisible(false)}
      />
    </View>
  );
}

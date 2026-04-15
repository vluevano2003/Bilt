import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
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
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/Profile.styles";
import {
  calculateTotalVolume,
  formatDuration,
} from "../src/utils/profileHelpers";
import { shareProfile } from "../src/utils/shareHelpers";

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, []);

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
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ zIndex: 10, padding: 5 }}
          >
            <Feather name="arrow-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Feather name="user-x" size={60} color={colors.textSecondary} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 22,
              fontWeight: "bold",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            {t("profile.userNotFoundTitle", "Usuario no encontrado")}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 10,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            {t(
              "profile.userNotFoundMsg",
              "Es posible que el enlace sea incorrecto o que el usuario haya eliminado su cuenta.",
            )}
          </Text>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                marginTop: 30,
                backgroundColor: colors.primary,
                paddingHorizontal: 30,
              },
            ]}
            onPress={handleGoBack}
          >
            <Text style={[styles.actionButtonText, { color: "#FFF" }]}>
              {t("common.backToHome", "Volver al inicio")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

  const isUnavailable = profile.isBlocked || profile.hasBlockedMe;
  const showContent =
    !isUnavailable &&
    (profile.isOwnProfile ||
      !profile.isPrivate ||
      profile.followStatus === "following");

  const displayedUserRoutines = userRoutines.filter(
    (r) => !r.originalCreatorId,
  );
  const displayedUserPacks = userPacks.filter((p) => !p.originalCreatorId);

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

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerContainer,
          { justifyContent: "space-between", paddingTop: insets.top + 10 },
        ]}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ zIndex: 10, padding: 5 }}
        >
          <Feather name="arrow-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 15, zIndex: 10 }}>
          {!isUnavailable && (
            <TouchableOpacity
              style={{ padding: 5 }}
              onPress={() => shareProfile(profileId || "", profile.username)}
            >
              <Feather name="share" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ padding: 5 }}
            onPress={() => setOptionsModalVisible(true)}
          >
            <Feather
              name="more-vertical"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

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
            <View style={{ alignItems: "center", marginTop: 80 }}>
              <Feather name="user-x" size={60} color={colors.textSecondary} />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 22,
                  fontWeight: "bold",
                  marginTop: 20,
                  textAlign: "center",
                }}
              >
                {t("profile.userBlockedTitle", "Usuario no disponible")}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  marginTop: 10,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                {t(
                  "profile.userNotFoundMsg",
                  "Es posible que el enlace sea incorrecto o que el usuario haya eliminado su cuenta.",
                )}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.centeredProfileInfo}>
                <View style={styles.avatarContainer}>
                  {profile.profilePic ? (
                    <Image
                      source={{ uri: profile.profilePic }}
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
                <Text style={styles.usernameText}>@{profile.username}</Text>

                {showContent && (
                  <>
                    <View style={styles.socialStatsRow}>
                      <TouchableOpacity
                        style={styles.socialStatBox}
                        onPress={() => openSocialModal("followers")}
                      >
                        <Text style={styles.socialStatNumber}>
                          {profile.followersCount}
                        </Text>
                        <Text style={styles.socialStatLabel}>
                          {t("profile.followers")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.socialStatBox}
                        onPress={() => openSocialModal("following")}
                      >
                        <Text style={styles.socialStatNumber}>
                          {profile.followingCount}
                        </Text>
                        <Text style={styles.socialStatLabel}>
                          {t("profile.following")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 20,
                        marginTop: 10,
                        marginBottom: 5,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: profile.bio
                            ? colors.textPrimary
                            : colors.textSecondary,
                          textAlign: "center",
                          fontSize: 15,
                          fontStyle: profile.bio ? "normal" : "italic",
                        }}
                      >
                        {profile.bio
                          ? profile.bio
                          : t(
                              "profile.defaultBio",
                              "Este usuario aún no ha agregado una presentación.",
                            )}
                      </Text>
                    </View>
                  </>
                )}

                <View style={{ width: "100%", marginTop: 10 }}>
                  {profile.hasPendingRequestFromThem ? (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        justifyContent: "center",
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            flex: 1,
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() =>
                          profile.handleFollowRequest(profileId!, true)
                        }
                      >
                        <Text
                          style={[styles.actionButtonText, { color: "#FFF" }]}
                        >
                          {t("social.accept")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { flex: 1, backgroundColor: colors.surface },
                        ]}
                        onPress={() =>
                          profile.handleFollowRequest(profileId!, false)
                        }
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("social.reject")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor:
                            profile.followStatus !== "none"
                              ? colors.surface
                              : colors.primary,
                          borderColor:
                            profile.followStatus !== "none"
                              ? colors.border
                              : colors.primary,
                        },
                      ]}
                      onPress={handleToggleFollow}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color:
                              profile.followStatus !== "none"
                                ? colors.textPrimary
                                : "#FFF",
                          },
                        ]}
                      >
                        {profile.followStatus === "following"
                          ? t("social.following")
                          : profile.followStatus === "pending"
                            ? t("social.requested")
                            : t("social.follow")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {!showContent ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Feather name="lock" size={50} color={colors.textSecondary} />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 18,
                      fontWeight: "bold",
                      marginTop: 15,
                    }}
                  >
                    {t("profile.privateAccount")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 5 }}>
                    {t("profile.privateMsg")}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.segmentContainer}>
                    <TouchableOpacity
                      style={[
                        styles.segmentButton,
                        activeTab === "routines" && styles.segmentButtonActive,
                      ]}
                      onPress={() => setActiveTab("routines")}
                    >
                      <Feather
                        name="grid"
                        size={22}
                        color={
                          activeTab === "routines"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentButton,
                        activeTab === "packs" && styles.segmentButtonActive,
                      ]}
                      onPress={() => setActiveTab("packs")}
                    >
                      <Feather
                        name="layers"
                        size={22}
                        color={
                          activeTab === "packs"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentButton,
                        activeTab === "history" && styles.segmentButtonActive,
                      ]}
                      onPress={() => setActiveTab("history")}
                    >
                      <AntDesign
                        name="calendar"
                        size={22}
                        color={
                          activeTab === "history"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={{ paddingHorizontal: 20 }}>
                    {isLoadingActivity ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : activeTab === "routines" ? (
                      displayedUserRoutines.length > 0 ? (
                        displayedUserRoutines.map((routine) => (
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
                              style={{
                                padding: 10,
                                backgroundColor: colors.background,
                                borderRadius: 10,
                              }}
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
                        <Text
                          style={{
                            color: colors.textSecondary,
                            textAlign: "center",
                            marginTop: 20,
                          }}
                        >
                          {t("profile.noPublicRoutines")}
                        </Text>
                      )
                    ) : activeTab === "packs" ? (
                      displayedUserPacks.length > 0 ? (
                        displayedUserPacks.map((pack) => (
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
                        <Text
                          style={{
                            color: colors.textSecondary,
                            textAlign: "center",
                            marginTop: 20,
                          }}
                        >
                          {t(
                            "weeklyPacks.noPublicPacks",
                            "Este usuario aún no tiene Packs Semanales.",
                          )}
                        </Text>
                      )
                    ) : userHistory.length > 0 ? (
                      <>
                        {userHistory.slice(0, historyLimit).map((session) => (
                          <TouchableOpacity
                            key={session.id}
                            style={[
                              styles.routineCard,
                              {
                                flexDirection: "column",
                                alignItems: "flex-start",
                              },
                            ]}
                            onPress={() => {
                              setSelectedItem(session);
                              setDetailsType("history");
                              setDetailsModalVisible(true);
                            }}
                          >
                            <Text style={styles.routineName}>
                              {session.routineName}
                            </Text>
                            <Text
                              style={{
                                color: colors.textSecondary,
                                fontSize: 13,
                                marginTop: 2,
                                marginBottom: 4,
                              }}
                            >
                              {new Date(session.completedAt).toLocaleDateString(
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
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "100%",
                                marginTop: 5,
                              }}
                            >
                              <Text style={styles.routineDetails}>
                                <Feather name="clock" size={12} />{" "}
                                {formatDuration(session.durationSeconds)} min
                              </Text>
                              <Text style={styles.routineDetails}>
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
                            style={{
                              paddingVertical: 12,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: colors.surface,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: colors.border,
                              marginBottom: 40,
                            }}
                            onPress={() => setHistoryLimit((prev) => prev + 10)}
                          >
                            <Text
                              style={{
                                color: colors.primary,
                                fontWeight: "bold",
                              }}
                            >
                              {t(
                                "profile.loadMore",
                                "Cargar más entrenamientos",
                              )}
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
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: colors.background,
                  padding: 20,
                  paddingBottom: Math.max(20, insets.bottom + 10),
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: 2,
                    alignSelf: "center",
                    marginBottom: 20,
                  }}
                />

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 15,
                  }}
                  onPress={() => {
                    setOptionsModalVisible(false);
                    setReportModalVisible(true);
                  }}
                >
                  <Feather
                    name="flag"
                    size={22}
                    color="#EF4444"
                    style={{ marginRight: 15 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#EF4444",
                      fontWeight: "600",
                    }}
                  >
                    {t("profile.report", "Reportar usuario")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 15,
                  }}
                  onPress={handleToggleBlock}
                >
                  <Feather
                    name="slash"
                    size={22}
                    color="#EF4444"
                    style={{ marginRight: 15 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#EF4444",
                      fontWeight: "600",
                    }}
                  >
                    {profile.isBlocked
                      ? t("profile.unblock", "Desbloquear usuario")
                      : t("profile.block", "Bloquear usuario")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 15,
                    borderTopWidth: 1,
                    borderColor: colors.border,
                    marginTop: 10,
                  }}
                  onPress={() => setOptionsModalVisible(false)}
                >
                  <Feather
                    name="x"
                    size={22}
                    color={colors.textPrimary}
                    style={{ marginRight: 15 }}
                  />
                  <Text style={{ fontSize: 16, color: colors.textPrimary }}>
                    {t("common.cancel", "Cancelar")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 15,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.textPrimary,
                  }}
                >
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

              <Text style={{ color: colors.textSecondary, marginBottom: 15 }}>
                {t(
                  "profile.reportReasonPrompt",
                  "¿Por qué quieres reportar a este usuario? Por favor detalla el motivo.",
                )}
              </Text>

              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderRadius: 10,
                  padding: 15,
                  minHeight: 100,
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 20,
                }}
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
                style={{
                  backgroundColor:
                    reportReason.trim().length > 0 ? "#EF4444" : colors.border,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                disabled={reportReason.trim().length === 0}
                onPress={handleSendReport}
              >
                <Text
                  style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}
                >
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

import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SocialUser, useProfile } from "../hooks/useProfile";
import { useProfileActions } from "../hooks/useProfileActions";
import { useUserActivity } from "../hooks/useUserActivity";
import { WeeklyPack } from "../hooks/useWeeklyPacks";
import {
  ItemDetailsModal,
  PackDetailsModal,
  SocialListModal,
} from "../src/components/ProfileModals";
import { colors } from "../src/constants/theme";
import { styles } from "../src/styles/Profile.styles";
import {
  calculateTotalVolume,
  formatDuration,
  getConvertedProfileHeight,
  getConvertedProfileWeight,
} from "../src/utils/profileHelpers";

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const profileId = params.id as string | undefined;

  const profile = useProfile(profileId);
  const { userRoutines, userHistory, userPacks, isLoadingActivity } =
    useUserActivity(profileId);
  const actions = useProfileActions(profileId, profile.username, userRoutines);

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

  if (profile.isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showContent =
    profile.isOwnProfile ||
    !profile.isPrivate ||
    profile.followStatus === "following";
  const displayedUserRoutines = userRoutines.filter(
    (r) => !r.originalCreatorId,
  );
  const displayedUserPacks = userPacks.filter((p) => !p.originalCreatorId);

  /**
   * Construye una cadena de texto con la información pública del perfil, basada en las preferencias de visibilidad del usuario
   * @returns
   */
  const getPublicDataString = () => {
    const data = [];
    if (profile.showAge && profile.age)
      data.push(`${profile.age} ${t("profile.years")}`);
    if (profile.showGender && profile.gender) data.push(profile.gender);
    if (profile.showHeight && profile.height) {
      const finalH = getConvertedProfileHeight(
        profile.height,
        profile.measurementSystem,
      );
      data.push(
        `${finalH} ${profile.measurementSystem === "metric" ? "cm" : "in"}`,
      );
    }
    if (profile.showWeight && profile.weight) {
      const finalW = getConvertedProfileWeight(
        profile.weight,
        profile.measurementSystem,
      );
      data.push(
        `${finalW} ${profile.measurementSystem === "metric" ? "kg" : "lbs"}`,
      );
    }
    return data.join(" • ");
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

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { justifyContent: "flex-start" }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ zIndex: 10 }}>
          <Feather name="arrow-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* PROFILE HEADER BLOCK */}
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

            <View style={styles.publicDataContainer}>
              <Text style={styles.publicDataText}>{getPublicDataString()}</Text>
            </View>

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
                    <Text style={[styles.actionButtonText, { color: "#FFF" }]}>
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
                  onPress={profile.toggleFollow}
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

          {/* CONTENT BLOCK */}
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
              {/* TABS */}
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

              {/* LISTS */}
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
                          <Text style={styles.routineName}>{routine.name}</Text>
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
                          <Text style={styles.routineName}>{pack.name}</Text>
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
                  userHistory.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.routineCard,
                        { flexDirection: "column", alignItems: "flex-start" },
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
                  ))
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
        </View>
      </ScrollView>

      {/* MODALS */}
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

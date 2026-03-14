import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SocialUser, useProfile } from "../hooks/useProfile";
import { useRoutines } from "../hooks/useRoutines";
import { useUserActivity } from "../hooks/useUserActivity";
import { auth, db } from "../src/config/firebase";
import { colors } from "../src/constants/theme";
import { styles } from "../src/styles/Profile.styles";

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const profileId = params.id as string | undefined;

  const {
    isLoading,
    username,
    profilePic,
    age,
    gender,
    measurementSystem,
    height,
    weight,
    isOwnProfile,
    isPrivate,
    showAge,
    showGender,
    showHeight,
    showWeight,
    followStatus,
    toggleFollow,
    followersCount,
    followingCount,
    getSocialList,
    hasPendingRequestFromThem,
    handleFollowRequest,
  } = useProfile(profileId);

  const [activeTab, setActiveTab] = useState<"routines" | "history">(
    "routines",
  );
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialModalType, setSocialModalType] = useState<
    "followers" | "following"
  >("followers");
  const [socialList, setSocialList] = useState<SocialUser[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const { userRoutines, userHistory, isLoadingActivity } =
    useUserActivity(profileId);
  const { routines: myRoutines, deleteRoutine } = useRoutines();

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsType, setDetailsType] = useState<"routine" | "history">(
    "routine",
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showContent =
    isOwnProfile || !isPrivate || followStatus === "following";

  const getConvertedProfileWeight = (w: string | number) => {
    let numW = Number(w) || 0;
    if (measurementSystem === "imperial") {
      return Math.round(numW * 2.20462);
    }
    return Math.round(numW);
  };

  const getConvertedProfileHeight = (h: string | number) => {
    let numH = Number(h) || 0;
    if (measurementSystem === "imperial") {
      return Math.round(numH / 2.54);
    }
    return Math.round(numH);
  };

  const getPublicDataString = () => {
    const data = [];
    if (showAge && age) data.push(`${age} ${t("profile.years")}`);
    if (showGender && gender) data.push(gender);
    if (showHeight && height) {
      const finalH = getConvertedProfileHeight(height);
      data.push(`${finalH} ${measurementSystem === "metric" ? "cm" : "in"}`);
    }
    if (showWeight && weight) {
      const finalW = getConvertedProfileWeight(weight);
      data.push(`${finalW} ${measurementSystem === "metric" ? "kg" : "lbs"}`);
    }
    return data.join(" • ");
  };

  const openSocialModal = async (type: "followers" | "following") => {
    if (!showContent) return;
    setSocialModalType(type);
    setSocialModalVisible(true);
    setLoadingSocial(true);
    const users = await getSocialList(type);
    setSocialList(users);
    setLoadingSocial(false);
  };

  const openDetails = (item: any, type: "routine" | "history") => {
    setSelectedItem(item);
    setDetailsType(type);
    setDetailsModalVisible(true);
  };

  const getConvertedWeight = (itemWeight: number, unit: string) => {
    const w = Number(itemWeight) || 0;
    if (measurementSystem === "metric" && unit === "lbs") return w * 0.453592;
    if (measurementSystem === "imperial" && unit === "kg") return w * 2.20462;
    return w;
  };

  const calculateTotalVolume = (session: any) => {
    if (!session?.exercises) return 0;
    let total = 0;
    session.exercises.forEach((ex: any) => {
      ex.sets?.forEach((set: any) => {
        if (set.completed) {
          const w = getConvertedWeight(set.weight, set.weightUnit);
          total += w * (Number(set.reps) || 0);
        }
      });
    });
    return Math.round(total);
  };

  const formatDuration = (seconds: number) => {
    const s = Number(seconds) || 0;
    return Math.ceil(s / 60);
  };

  const getSavedRoutineId = (originalRoutineId: string) => {
    const found = myRoutines.find(
      (r) => r.originalRoutineId === originalRoutineId,
    );
    return found ? found.id : null;
  };

  const handleToggleSaveRoutine = async (routineToToggle: any) => {
    const savedId = getSavedRoutineId(routineToToggle.id);

    if (savedId) {
      try {
        await deleteRoutine(savedId);
        Alert.alert(t("profile.alerts.success"), t("routines.successRemoved"));
        setDetailsModalVisible(false);
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    } else {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      try {
        const myRoutinesRef = collection(
          db,
          "users",
          currentUserId,
          "routines",
        );
        await addDoc(myRoutinesRef, {
          name: routineToToggle.name,
          exercises: routineToToggle.exercises,
          createdAt: Date.now(),
          originalCreatorId: profileId,
          originalCreatorName: username,
          originalRoutineId: routineToToggle.id,
        });

        Alert.alert(t("profile.alerts.success"), t("routines.successSaved"));
        setDetailsModalVisible(false);
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    }
  };

  const renderSocialItem = ({ item }: { item: SocialUser }) => (
    <TouchableOpacity
      style={styles.socialListItem}
      onPress={() => {
        setSocialModalVisible(false);
        if (item.id !== auth.currentUser?.uid) {
          router.push({ pathname: "/userProfile", params: { id: item.id } });
        }
      }}
    >
      {item.profilePictureUrl ? (
        <Image
          source={{ uri: item.profilePictureUrl }}
          style={styles.socialListAvatar}
        />
      ) : (
        <View style={styles.socialListAvatarPlaceholder}>
          <AntDesign name="user" size={20} color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.socialListUsername}>@{item.username}</Text>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { justifyContent: "flex-start" }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ zIndex: 10 }}>
          <Feather name="arrow-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <View style={styles.centeredProfileInfo}>
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
              {hasPendingRequestFromThem ? (
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
                    onPress={() => handleFollowRequest(profileId!, true)}
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
                    onPress={() => handleFollowRequest(profileId!, false)}
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
                        followStatus !== "none"
                          ? colors.surface
                          : colors.primary,
                      borderColor:
                        followStatus !== "none"
                          ? colors.border
                          : colors.primary,
                    },
                  ]}
                  onPress={toggleFollow}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color:
                          followStatus !== "none" ? colors.textPrimary : "#FFF",
                      },
                    ]}
                  >
                    {followStatus === "following"
                      ? t("social.following")
                      : followStatus === "pending"
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
                    size={24}
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
                    activeTab === "history" && styles.segmentButtonActive,
                  ]}
                  onPress={() => setActiveTab("history")}
                >
                  <AntDesign
                    name="calendar"
                    size={24}
                    color={
                      activeTab === "history"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>

              {/*Rutinas*/}
              {activeTab === "routines" && (
                <View style={{ paddingHorizontal: 20 }}>
                  {isLoadingActivity ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : userRoutines.length > 0 ? (
                    userRoutines.map((routine) => {
                      const isSaved = !!getSavedRoutineId(routine.id);

                      return (
                        <View key={routine.id} style={styles.routineCard}>
                          <TouchableOpacity
                            style={styles.routineInfo}
                            onPress={() => openDetails(routine, "routine")}
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
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              borderRadius: 10,
                            }}
                            onPress={() => handleToggleSaveRoutine(routine)}
                          >
                            <FontAwesome
                              name={isSaved ? "bookmark" : "bookmark-o"}
                              size={22}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })
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
                  )}
                </View>
              )}

              {/*Historial*/}
              {activeTab === "history" && (
                <View style={{ paddingHorizontal: 20 }}>
                  {isLoadingActivity ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : userHistory.length > 0 ? (
                    userHistory.map((session) => {
                      const durationMins = formatDuration(
                        session.durationSeconds,
                      );
                      const totalVolume = calculateTotalVolume(session);
                      const volumeUnit =
                        measurementSystem === "metric" ? "kg" : "lbs";

                      return (
                        <TouchableOpacity
                          key={session.id}
                          style={[
                            styles.routineCard,
                            {
                              flexDirection: "column",
                              alignItems: "flex-start",
                            },
                          ]}
                          onPress={() => openDetails(session, "history")}
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
                              <Feather name="clock" size={12} /> {durationMins}{" "}
                              min
                            </Text>
                            <Text style={styles.routineDetails}>
                              <Feather name="activity" size={12} />{" "}
                              {totalVolume} {volumeUnit}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
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
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/*Seguidos y seguidores*/}
      <Modal
        visible={socialModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {socialModalType === "followers"
                  ? t("profile.followers")
                  : t("profile.following")}
              </Text>
              <TouchableOpacity onPress={() => setSocialModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {loadingSocial ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 50 }}
              />
            ) : socialList.length > 0 ? (
              <FlatList
                data={socialList}
                keyExtractor={(item) => item.id}
                renderItem={renderSocialItem}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 40,
                }}
              >
                {t("social.noResults")}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/*Detalles*/}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {detailsType === "routine"
                  ? selectedItem?.name
                  : selectedItem?.routineName}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/*Vista de rutina*/}
              {detailsType === "routine" && (
                <View>
                  <Text style={[styles.label, { marginBottom: 10 }]}>
                    {t("routines.exercises")}:
                  </Text>
                  {selectedItem?.exercises?.map(
                    (exercise: any, index: number) => {
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
                          {exercise.sets?.map((set: any, setIdx: number) => (
                            <Text
                              key={setIdx}
                              style={{
                                color: colors.textSecondary,
                                marginLeft: 15,
                                fontSize: 14,
                              }}
                            >
                              Set {setIdx + 1}: {set.reps} reps
                            </Text>
                          ))}
                        </View>
                      );
                    },
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        marginTop: 30,
                        backgroundColor: !!getSavedRoutineId(selectedItem?.id)
                          ? colors.surface
                          : colors.primary,
                        borderColor: !!getSavedRoutineId(selectedItem?.id)
                          ? colors.border
                          : colors.primary,
                        flexDirection: "row",
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => handleToggleSaveRoutine(selectedItem)}
                  >
                    <FontAwesome
                      name={
                        !!getSavedRoutineId(selectedItem?.id)
                          ? "bookmark"
                          : "bookmark-o"
                      }
                      size={18}
                      color={
                        !!getSavedRoutineId(selectedItem?.id)
                          ? colors.textPrimary
                          : "#FFF"
                      }
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        {
                          color: !!getSavedRoutineId(selectedItem?.id)
                            ? colors.textPrimary
                            : "#FFF",
                        },
                      ]}
                    >
                      {!!getSavedRoutineId(selectedItem?.id)
                        ? t("routines.removeFromProfile")
                        : t("routines.saveToProfile")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/*Vista de historial*/}
              {detailsType === "history" && (
                <View>
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
                    <Text
                      style={{ color: colors.textPrimary, fontWeight: "bold" }}
                    >
                      <Feather name="clock" size={16} />{" "}
                      {formatDuration(selectedItem?.durationSeconds)} min
                    </Text>
                    <Text
                      style={{ color: colors.textPrimary, fontWeight: "bold" }}
                    >
                      <Feather name="activity" size={16} />{" "}
                      {calculateTotalVolume(selectedItem)}{" "}
                      {measurementSystem === "metric" ? "kg" : "lbs"}
                    </Text>
                  </View>

                  <Text style={[styles.label, { marginBottom: 10 }]}>
                    {t("routines.exercises")}:
                  </Text>
                  {selectedItem?.exercises?.map(
                    (exercise: any, index: number) => {
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
                            const convertedWeight = Math.round(
                              getConvertedWeight(set.weight, set.weightUnit),
                            );
                            const displayUnit =
                              set.weightUnit === "bars"
                                ? "bars"
                                : measurementSystem === "metric"
                                  ? "kg"
                                  : "lbs";

                            return (
                              <Text
                                key={setIdx}
                                style={{
                                  color: colors.textSecondary,
                                  marginLeft: 15,
                                  fontSize: 14,
                                }}
                              >
                                Set {setIdx + 1}: {set.reps} reps x{" "}
                                {convertedWeight} {displayUnit}
                              </Text>
                            );
                          })}
                        </View>
                      );
                    },
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

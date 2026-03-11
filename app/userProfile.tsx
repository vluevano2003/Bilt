import { AntDesign, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SocialUser, useProfile } from "../hooks/useProfile";
import { auth } from "../src/config/firebase";
import { colors } from "../src/constants/theme";
import { styles } from "../src/styles/ProfileScreen.styles";

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

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showContent =
    isOwnProfile || !isPrivate || followStatus === "following";

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

  const openSocialModal = async (type: "followers" | "following") => {
    if (!showContent) return;
    setSocialModalType(type);
    setSocialModalVisible(true);
    setLoadingSocial(true);
    const users = await getSocialList(type);
    setSocialList(users);
    setLoadingSocial(false);
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", left: 20, zIndex: 10 }}
        >
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

              {activeTab === "routines" && (
                <View>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    Las rutinas aparecerán aquí.
                  </Text>
                </View>
              )}
              {activeTab === "history" && (
                <View>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    El historial aparecerá aquí.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

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
    </View>
  );
}

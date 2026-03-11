import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
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
import { SocialUser, useProfile } from "../../hooks/useProfile";
import { CustomInput } from "../../src/components/CustomInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { auth } from "../../src/config/firebase";
import { colors } from "../../src/constants/theme";
import { styles } from "../../src/styles/ProfileScreen.styles";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

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
    pendingRequestsCount,
    getSocialList,
    handleFollowRequest,
  } = useProfile();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"routines" | "history">(
    "routines",
  );
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialModalType, setSocialModalType] = useState<
    "followers" | "following" | "requests"
  >("followers");
  const [socialList, setSocialList] = useState<SocialUser[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };
  const toggleLanguage = (lang: string) => i18n.changeLanguage(lang);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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

  const openSocialModal = async (
    type: "followers" | "following" | "requests",
  ) => {
    setSocialModalType(type);
    setSocialModalVisible(true);
    setLoadingSocial(true);
    const users = await getSocialList(type);
    setSocialList(users);
    setLoadingSocial(false);
  };

  const renderSocialItem = ({ item }: { item: SocialUser }) => (
    <View style={styles.socialListItem}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
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
        <Text style={styles.socialListUsername} numberOfLines={1}>
          @{item.username}
        </Text>
      </TouchableOpacity>

      {socialModalType === "requests" ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 5,
            }}
            onPress={() => {
              handleFollowRequest(item.id, true);
              setSocialList((prev) => prev.filter((u) => u.id !== item.id));
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 12 }}>
              {t("social.accept")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => {
              handleFollowRequest(item.id, false);
              setSocialList((prev) => prev.filter((u) => u.id !== item.id));
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              X
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { justifyContent: "flex-end" }]}>
        {isPrivate && pendingRequestsCount > 0 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              left: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => openSocialModal("requests")}
          >
            <View
              style={{
                backgroundColor: "#EF4444",
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 5,
              }}
            />
            <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
              {pendingRequestsCount} {t("social.requests")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <AntDesign name="setting" size={28} color={colors.textPrimary} />
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
        </View>
      </ScrollView>

      {/*MODAL EDICIÓN*/}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
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

              <Text style={styles.label}>{t("profile.measurementSystem")}</Text>
              <View style={styles.formSegmentContainer}>
                <TouchableOpacity
                  style={[
                    styles.formSegmentButton,
                    measurementSystem === "metric" &&
                      styles.formSegmentButtonActive,
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
                    {t("profile.metric")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formSegmentButton,
                    measurementSystem === "imperial" &&
                      styles.formSegmentButtonActive,
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
                  <CustomInput
                    value={email}
                    editable={false}
                    style={styles.readOnlyInput}
                  />
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 15, marginBottom: 10 }]}>
                {t("profile.visibilityOptions")}
              </Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t("profile.showAge")}</Text>
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
        </KeyboardAvoidingView>
      </Modal>

      {/*MODAL AJUSTES*/}
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
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                {t("profile.privateAccount")}
              </Text>
              <Switch
                value={isPrivate}
                onValueChange={togglePrivacy}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#FFF"}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t("profile.language")}</Text>
              <View
                style={[
                  styles.formSegmentContainer,
                  { width: 140, marginBottom: 0 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.formSegmentButton,
                    i18n.language.includes("es") &&
                      styles.formSegmentButtonActive,
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
                    styles.formSegmentButton,
                    i18n.language.includes("en") &&
                      styles.formSegmentButtonActive,
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
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t("profile.darkMode")}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#FFF"}
              />
            </View>
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

      {/*MODAL LISTA SOCIAL*/}
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
                  : socialModalType === "following"
                    ? t("profile.following")
                    : t("social.requests")}
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

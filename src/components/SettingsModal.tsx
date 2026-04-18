import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getStyles } from "../styles/Profile.styles";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isPrivate: boolean;
  togglePrivacy: (val: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
  deleteAccount: () => void;
  getBlockedUsersList: () => Promise<any[]>;
  unblockUserFromList: (id: string) => Promise<void>;
  t: any;
  i18n: any;
  toggleLanguage: (lang: string) => void;
  colors: any;
}

export const SettingsModal = ({
  visible,
  onClose,
  isPrivate,
  togglePrivacy,
  isDarkMode,
  toggleTheme,
  handleLogout,
  deleteAccount,
  getBlockedUsersList,
  unblockUserFromList,
  t,
  i18n,
  toggleLanguage,
  colors,
}: SettingsModalProps) => {
  const styles = getStyles(colors);

  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const loadBlockedUsers = async () => {
    const list = await getBlockedUsersList();
    setBlockedUsers(list);
  };

  const handleUnblock = async (blockedId: string) => {
    await unblockUserFromList(blockedId);
    loadBlockedUsers();
  };

  const safePaddingTop =
    Platform.OS === "android"
      ? (StatusBar.currentHeight || verticalScale(20)) + verticalScale(15)
      : verticalScale(20);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: scale(20),
              paddingTop: safePaddingTop,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <Feather
                name="arrow-left"
                size={scale(26)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: moderateScale(20),
                fontWeight: "bold",
                color: colors.textPrimary,
                marginLeft: scale(20),
              }}
            >
              {t("profile.settings")}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: verticalScale(60) }}
          >
            {/* SECCIÓN CUENTA */}
            <View
              style={{
                paddingHorizontal: scale(20),
                paddingTop: verticalScale(30),
                paddingBottom: verticalScale(10),
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(13),
                  color: colors.primary,
                  fontWeight: "bold",
                  marginBottom: verticalScale(15),
                  letterSpacing: scale(1),
                }}
              >
                {t("profile.accountSection")}
              </Text>

              <View
                style={[
                  styles.settingRow,
                  { paddingHorizontal: 0, paddingVertical: verticalScale(10) },
                ]}
              >
                <Text
                  style={[styles.settingLabel, { fontSize: moderateScale(16) }]}
                >
                  {t("profile.privateAccount")}
                </Text>
                <Switch
                  value={isPrivate}
                  onValueChange={togglePrivacy}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                />
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(15),
                }}
                onPress={() => {
                  loadBlockedUsers();
                  setBlockedModalVisible(true);
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: moderateScale(16),
                  }}
                >
                  {t("profile.blockedUsers")}
                </Text>
                <Feather
                  name="chevron-right"
                  size={scale(20)}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: verticalScale(15),
                }}
                onPress={deleteAccount}
              >
                <Text
                  style={{
                    color: "#EF4444",
                    fontSize: moderateScale(16),
                    fontWeight: "600",
                  }}
                >
                  {t("profile.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN PREFERENCIAS */}
            <View
              style={{
                paddingHorizontal: scale(20),
                paddingTop: verticalScale(30),
                paddingBottom: verticalScale(20),
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(13),
                  color: colors.primary,
                  fontWeight: "bold",
                  marginBottom: verticalScale(15),
                  letterSpacing: scale(1),
                }}
              >
                {t("profile.preferencesSection")}
              </Text>

              <View
                style={[
                  styles.settingRow,
                  { paddingHorizontal: 0, paddingVertical: verticalScale(10) },
                ]}
              >
                <Text
                  style={[styles.settingLabel, { fontSize: moderateScale(16) }]}
                >
                  {t("profile.language")}
                </Text>
                <View
                  style={[
                    styles.formSegmentContainer,
                    { width: scale(140), marginBottom: 0 },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.formSegmentButton,
                      i18n.language.includes("es") &&
                        styles.formSegmentButtonActive,
                      { paddingVertical: verticalScale(6) },
                    ]}
                    onPress={() => toggleLanguage("es")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        i18n.language.includes("es") &&
                          styles.segmentTextActive,
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
                      { paddingVertical: verticalScale(6) },
                    ]}
                    onPress={() => toggleLanguage("en")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        i18n.language.includes("en") &&
                          styles.segmentTextActive,
                      ]}
                    >
                      EN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.settingRow,
                  { paddingHorizontal: 0, paddingVertical: verticalScale(10) },
                ]}
              >
                <Text
                  style={[styles.settingLabel, { fontSize: moderateScale(16) }]}
                >
                  {t("profile.darkMode")}
                </Text>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                />
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: verticalScale(20),
                  marginTop: verticalScale(10),
                }}
                onPress={handleLogout}
              >
                <AntDesign
                  name="logout"
                  size={scale(20)}
                  color="#EF4444"
                  style={{ marginRight: scale(15) }}
                />
                <Text
                  style={{
                    color: "#EF4444",
                    fontSize: moderateScale(16),
                    fontWeight: "600",
                  }}
                >
                  {t("profile.logout")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Usuarios Bloqueados */}
      <Modal
        visible={blockedModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setBlockedModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: scale(20),
              paddingTop: safePaddingTop,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={() => setBlockedModalVisible(false)}>
              <Feather
                name="arrow-left"
                size={scale(26)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: moderateScale(20),
                fontWeight: "bold",
                color: colors.textPrimary,
                marginLeft: scale(20),
              }}
            >
              {t("profile.blockedUsers")}
            </Text>
          </View>

          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: scale(20) }}
            ListEmptyComponent={() => (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: verticalScale(40),
                }}
              >
                {t("profile.noBlockedUsers")}
              </Text>
            )}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: verticalScale(20),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.profile_picture_url ? (
                    <Image
                      source={{ uri: item.profile_picture_url }}
                      style={{
                        width: scale(40),
                        height: scale(40),
                        borderRadius: scale(20),
                        marginRight: scale(15),
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: scale(40),
                        height: scale(40),
                        borderRadius: scale(20),
                        backgroundColor: colors.surface,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: scale(15),
                      }}
                    >
                      <AntDesign
                        name="user"
                        size={scale(20)}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: moderateScale(16),
                      fontWeight: "bold",
                    }}
                  >
                    @{item.username}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: scale(15),
                    paddingVertical: verticalScale(8),
                    backgroundColor: colors.surface,
                    borderRadius: scale(8),
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => handleUnblock(item.id)}
                >
                  <Text
                    style={{ color: colors.textPrimary, fontWeight: "bold" }}
                  >
                    {t("profile.unblock")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

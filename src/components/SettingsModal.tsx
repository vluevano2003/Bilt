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
    Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 15 : 20;

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
              padding: 20,
              paddingTop: safePaddingTop,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <Feather name="arrow-left" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.textPrimary,
                marginLeft: 20,
              }}
            >
              {t("profile.settings")}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            {/* SECCIÓN CUENTA */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 30,
                paddingBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: colors.primary,
                  fontWeight: "bold",
                  marginBottom: 15,
                  letterSpacing: 1,
                }}
              >
                {t("profile.accountSection")}
              </Text>

              <View
                style={[
                  styles.settingRow,
                  { paddingHorizontal: 0, paddingVertical: 10 },
                ]}
              >
                <Text style={[styles.settingLabel, { fontSize: 16 }]}>
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
                  paddingVertical: 15,
                }}
                onPress={() => {
                  loadBlockedUsers();
                  setBlockedModalVisible(true);
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                  {t("profile.blockedUsers")}
                </Text>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 15,
                }}
                onPress={deleteAccount}
              >
                <Text
                  style={{ color: "#EF4444", fontSize: 16, fontWeight: "600" }}
                >
                  {t("profile.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN PREFERENCIAS */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 30,
                paddingBottom: 20,
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: colors.primary,
                  fontWeight: "bold",
                  marginBottom: 15,
                  letterSpacing: 1,
                }}
              >
                {t("profile.preferencesSection")}
              </Text>

              <View
                style={[
                  styles.settingRow,
                  { paddingHorizontal: 0, paddingVertical: 10 },
                ]}
              >
                <Text style={[styles.settingLabel, { fontSize: 16 }]}>
                  {t("profile.language")}
                </Text>
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
                      { paddingVertical: 6 },
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
                  { paddingHorizontal: 0, paddingVertical: 10 },
                ]}
              >
                <Text style={[styles.settingLabel, { fontSize: 16 }]}>
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
                  paddingVertical: 20,
                  marginTop: 10,
                }}
                onPress={handleLogout}
              >
                <AntDesign
                  name="logout"
                  size={20}
                  color="#EF4444"
                  style={{ marginRight: 15 }}
                />
                <Text
                  style={{ color: "#EF4444", fontSize: 16, fontWeight: "600" }}
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
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 20,
              paddingTop: safePaddingTop,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={() => setBlockedModalVisible(false)}>
              <Feather name="arrow-left" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.textPrimary,
                marginLeft: 20,
              }}
            >
              {t("profile.blockedUsers")}
            </Text>
          </View>

          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={() => (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 40,
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
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.profile_picture_url ? (
                    <Image
                      source={{ uri: item.profile_picture_url }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 15,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 15,
                      }}
                    >
                      <AntDesign
                        name="user"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    @{item.username}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
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

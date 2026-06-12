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
  Alert,
} from "react-native";
import packageJson from "../../package.json";
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

/**
 * Modal de configuración del perfil, con opciones para privacidad, tema, idioma, gestión de usuarios bloqueados, etc.
 * @param param0
 * @returns
 */
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

  const confirmLogout = () => {
    Alert.alert(
      t("profile.logoutConfirmTitle"),
      t("profile.logoutConfirmMsg"),
      [
        {
          text: t("profile.cancel"),
          style: "cancel",
        },
        {
          text: t("profile.logout"),
          style: "destructive",
          onPress: handleLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const handleTogglePrivacy = (newValue: boolean) => {
    const title = newValue ? t("profile.enablePrivateTitle") : t("profile.disablePrivateTitle");
    const msg = newValue ? t("profile.enablePrivateMsg") : t("profile.disablePrivateMsg");

    Alert.alert(
      title,
      msg,
      [
        { text: t("profile.cancel"), style: "cancel" },
        { 
          text: t("profile.confirm"), 
          style: newValue ? "default" : "destructive", 
          onPress: () => togglePrivacy(newValue) 
        }
      ],
      { cancelable: true }
    );
  };

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  /**
   * Carga la lista de usuarios bloqueados para mostrarla en el modal correspondiente.
   */
  const loadBlockedUsers = async () => {
    const list = await getBlockedUsersList();
    setBlockedUsers(list);
  };

  /**
   * Desbloquea a un usuario de la lista de bloqueados y recarga la lista para reflejar el cambio.
   * @param blockedId
   */
  const handleUnblock = async (blockedId: string) => {
    await unblockUserFromList(blockedId);
    loadBlockedUsers();
  };

  /**
   * Calcula un padding top seguro para el header del modal, considerando la barra de estado en Android y un valor fijo en iOS.
   * Esto asegura que el contenido no quede oculto detrás de la barra de estado, especialmente en dispositivos con notch o barras de estado altas.
   */
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
              justifyContent: "space-between",
              paddingHorizontal: scale(20),
              paddingTop: safePaddingTop,
              paddingBottom: verticalScale(15),
            }}
          >
            <View style={{ width: scale(24) }} />
            <Text
              style={{
                fontSize: moderateScale(18),
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              {t("profile.settings")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather
                name="x"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: verticalScale(60) }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginTop: verticalScale(10) }}>
              {/* Option: Private Account */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(16),
                  paddingHorizontal: scale(20),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Feather name="lock" size={scale(22)} color={colors.textPrimary} style={{ marginRight: scale(16) }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: moderateScale(16), fontWeight: "600", color: colors.textPrimary }}>
                      {t("profile.privateAccount")}
                    </Text>
                    <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginTop: verticalScale(2) }}>
                      {t("profile.privateAccountDesc")}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={handleTogglePrivacy}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                  style={{ marginLeft: scale(10) }}
                />
              </View>

              {/* Option: Blocked Users */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(16),
                  paddingHorizontal: scale(20),
                }}
                activeOpacity={0.7}
                onPress={() => {
                  loadBlockedUsers();
                  setBlockedModalVisible(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Feather name="user-x" size={scale(22)} color={colors.textPrimary} style={{ marginRight: scale(16) }} />
                  <Text style={{ fontSize: moderateScale(16), fontWeight: "600", color: colors.textPrimary }}>
                    {t("profile.blockedUsers")}
                  </Text>
                </View>
                <Feather name="chevron-right" size={scale(20)} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Option: Language */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(16),
                  paddingHorizontal: scale(20),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Feather name="globe" size={scale(22)} color={colors.textPrimary} style={{ marginRight: scale(16) }} />
                  <Text style={{ fontSize: moderateScale(16), fontWeight: "600", color: colors.textPrimary }}>
                    {t("profile.language")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.formSegmentContainer,
                    { width: scale(120), marginBottom: 0, marginTop: 0 },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.formSegmentButton,
                      i18n.language.includes("es") && styles.formSegmentButtonActive,
                      { paddingVertical: verticalScale(4) },
                    ]}
                    onPress={() => toggleLanguage("es")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { fontSize: moderateScale(12) },
                        i18n.language.includes("es") && styles.segmentTextActive,
                      ]}
                    >
                      ES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.formSegmentButton,
                      i18n.language.includes("en") && styles.formSegmentButtonActive,
                      { paddingVertical: verticalScale(4) },
                    ]}
                    onPress={() => toggleLanguage("en")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { fontSize: moderateScale(12) },
                        i18n.language.includes("en") && styles.segmentTextActive,
                      ]}
                    >
                      EN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Option: Dark Mode */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(16),
                  paddingHorizontal: scale(20),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Feather name={isDarkMode ? "moon" : "sun"} size={scale(22)} color={colors.textPrimary} style={{ marginRight: scale(16) }} />
                  <Text style={{ fontSize: moderateScale(16), fontWeight: "600", color: colors.textPrimary }}>
                    {t("profile.darkMode")}
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                />
              </View>

              {/* Option: Delete Account */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: verticalScale(16),
                  paddingHorizontal: scale(20),
                }}
                activeOpacity={0.7}
                onPress={deleteAccount}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Feather name="trash-2" size={scale(22)} color={colors.textPrimary} style={{ marginRight: scale(16) }} />
                  <Text style={{ fontSize: moderateScale(16), fontWeight: "600", color: colors.textPrimary }}>
                    {t("profile.deleteAccount")}
                  </Text>
                </View>
                <Feather name="chevron-right" size={scale(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Logout and Footer */}
            <View style={{ marginTop: verticalScale(40), alignItems: "center" }}>
              <TouchableOpacity
                onPress={confirmLogout}
                style={{ paddingVertical: verticalScale(10), paddingHorizontal: scale(20) }}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: moderateScale(16) }}>
                  {t("profile.logout")}
                </Text>
              </TouchableOpacity>

              <Text style={{ color: colors.textSecondary, fontSize: moderateScale(11), marginTop: verticalScale(15) }}>
                Bilt Tracker Version {packageJson.version}
              </Text>
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

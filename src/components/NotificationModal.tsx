import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NotificationItem } from "../../hooks/useNotifications";
import { SocialUser } from "../../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

interface Props {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  requestsList: SocialUser[];
  historyList: NotificationItem[];
  onHandleRequest: (id: string, accept: boolean) => void;
}

export function NotificationModal({
  visible,
  onClose,
  loading,
  requestsList,
  historyList,
  onHandleRequest,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  const handleNavigate = (id: string) => {
    onClose();
    if (id !== user?.id) {
      router.push({ pathname: "/userProfile", params: { id } });
    }
  };

  const renderAvatar = (url?: string) => {
    return url ? (
      <Image source={{ uri: url }} style={styles.socialListAvatar} />
    ) : (
      <View style={styles.socialListAvatarPlaceholder}>
        <AntDesign name="user" size={scale(20)} color={colors.textSecondary} />
      </View>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return t("social.time.justNow");
    if (diffMins < 60)
      return t("social.time.minsAgo", {
        count: diffMins,
        defaultValue: `Hace ${diffMins} min`,
      });

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return t("social.time.hoursAgo", {
        count: diffHours,
        defaultValue: `Hace ${diffHours} h`,
      });

    const diffDays = Math.floor(diffHours / 24);
    return t("social.time.daysAgo", {
      count: diffDays,
      defaultValue: `Hace ${diffDays} d`,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("social.notificationsTitle")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: verticalScale(50) }}
            />
          ) : requestsList.length === 0 && historyList.length === 0 ? (
            <Text style={styles.emptyText}>{t("social.noNotifications")}</Text>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: verticalScale(20) }}
            >
              {requestsList.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>
                    {t("social.requests")}
                  </Text>
                  {requestsList.map((item) => (
                    <View key={`req-${item.id}`} style={styles.socialListItem}>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                        onPress={() => handleNavigate(item.id)}
                      >
                        {renderAvatar(item.profilePictureUrl)}
                        <Text
                          style={styles.socialListUsername}
                          numberOfLines={1}
                        >
                          @{item.username}
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: "row", gap: scale(10) }}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => onHandleRequest(item.id, true)}
                        >
                          <Text style={styles.acceptText}>
                            {t("social.accept")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => onHandleRequest(item.id, false)}
                        >
                          <Text style={styles.rejectText}>X</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {historyList.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>
                    {t("social.activity")}
                  </Text>
                  {historyList.map((item) => {
                    const actionText =
                      item.type === "new_follower"
                        ? t("social.startedFollowing")
                        : t("social.acceptedRequest");

                    return (
                      <View
                        key={`hist-${item.id}`}
                        style={styles.socialListItem}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            flex: 1,
                            paddingRight: scale(10),
                          }}
                          onPress={() => handleNavigate(item.actor.id)}
                        >
                          {renderAvatar(item.actor.profilePictureUrl)}
                          <Text style={styles.historyText} numberOfLines={2}>
                            <Text style={styles.historyUsername}>
                              @{item.actor.username}
                            </Text>{" "}
                            {actionText}{" "}
                            <Text style={styles.timeText}>
                              {getTimeAgo(item.createdAt)}
                            </Text>
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: scale(25),
      borderTopRightRadius: scale(25),
      padding: scale(25),
      paddingBottom: verticalScale(30),
      height: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(15),
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(22),
      fontWeight: "bold",
    },
    sectionContainer: {
      marginTop: verticalScale(10),
      marginBottom: verticalScale(20),
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
      marginBottom: verticalScale(10),
    },
    socialListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(10),
    },
    socialListAvatar: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      marginRight: scale(15),
      borderWidth: 1,
      borderColor: colors.border,
    },
    socialListAvatarPlaceholder: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      marginRight: scale(15),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    socialListUsername: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "600",
    },
    historyText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
    },
    historyUsername: {
      color: colors.textPrimary,
      fontWeight: "bold",
    },
    timeText: {
      color: colors.textSecondary,
      fontSize: moderateScale(12),
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
      borderRadius: scale(5),
    },
    acceptText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(12),
    },
    rejectButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
      borderRadius: scale(5),
      borderWidth: 1,
      borderColor: colors.border,
    },
    rejectText: {
      color: colors.textPrimary,
      fontWeight: "bold",
      fontSize: moderateScale(12),
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: verticalScale(40),
    },
  });

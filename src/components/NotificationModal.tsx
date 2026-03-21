import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SocialUser } from "../../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  requestsList: SocialUser[];
  onHandleRequest: (id: string, accept: boolean) => void;
}

/**
 * Modal para mostrar las solicitudes de amistad o seguimiento. Permite aceptar o rechazar cada solicitud
 * @param param0
 * @returns
 */
export function NotificationModal({
  visible,
  onClose,
  loading,
  requestsList,
  onHandleRequest,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  const renderItem = ({ item }: { item: SocialUser }) => (
    <View style={styles.socialListItem}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={() => {
          onClose();
          if (item.id !== user?.id) {
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

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onHandleRequest(item.id, true)}
        >
          <Text style={styles.acceptText}>{t("social.accept")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onHandleRequest(item.id, false)}
        >
          <Text style={styles.rejectText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <Text style={styles.modalTitle}>{t("social.requests")}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 50 }}
            />
          ) : requestsList.length > 0 ? (
            <FlatList
              data={requestsList}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>{t("social.noNotifications")}</Text>
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
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      padding: 30,
      paddingBottom: 50,
      height: "70%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "bold" },
    socialListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    socialListAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 15,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    socialListAvatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 15,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    socialListUsername: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
    },
    acceptText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
    rejectButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rejectText: { color: colors.textPrimary, fontWeight: "bold", fontSize: 12 },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
    },
  });

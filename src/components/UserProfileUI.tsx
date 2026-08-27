import { AntDesign, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { scale, verticalScale } from "../utils/Responsive";
import { ClayCard } from "./ClayCard";

/**
 * Componente de barra de navegación superior para el perfil de usuario. Incluye botones para volver, compartir y opciones adicionales.
 * @param param0
 * @returns
 */
export const TopNavigationBar = ({
  colors,
  styles,
  insets,
  onBack,
  onShare,
  onOptions,
  showActions,
}: any) => (
  <View
    style={[
      styles.headerContainer,
      {
        justifyContent: "space-between",
        paddingTop: insets.top + verticalScale(10),
      },
    ]}
  >
    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
      <Feather name="arrow-left" size={scale(28)} color={colors.textPrimary} />
    </TouchableOpacity>
    <View style={styles.headerRightIcons}>
      {showActions && (
        <TouchableOpacity style={styles.iconButton} onPress={onShare}>
          <Feather name="share" size={scale(24)} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.iconButton} onPress={onOptions}>
        <Feather
          name="more-vertical"
          size={scale(24)}
          color={colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * Componente de estado vacío para mostrar cuando no hay contenido disponible. Incluye un ícono, título, mensaje y un botón de acción opcional.
 * @param param0
 * @returns
 */
export const EmptyState = ({
  styles,
  icon,
  title,
  message,
  colors,
  actionButton,
}: any) => (
  <View style={styles.emptyStateContainer}>
    <Feather name={icon} size={scale(60)} color={colors.textSecondary} />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateText}>{message}</Text>
    {actionButton}
  </View>
);

/**
 * Componente de tarjeta de información del usuario. Muestra el avatar, nombre de usuario, estadísticas sociales (seguidores y seguidos), biografía y un botón de acción para seguir o gestionar solicitudes de seguimiento.
 * @param param0
 * @returns
 */
export const UserInfoCard = ({
  t,
  colors,
  styles,
  profile,
  profileId,
  openSocialModal,
  handleToggleFollow,
}: any) => {
  const router = useRouter();
  
  return (
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
            size={scale(45)}
            color={colors.textSecondary}
          />
        </View>
      )}
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: -scale(10),
        backgroundColor: profile.currentStreak > 0 ? '#f97316' : colors.surface,
        paddingHorizontal: scale(8),
        paddingVertical: scale(4),
        borderRadius: scale(12),
        borderWidth: 2,
        borderColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: profile.currentStreak > 0 ? '#f97316' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: profile.currentStreak > 0 ? 0.5 : 0.1,
        shadowRadius: 4,
        elevation: 4
      }}>
        <FontAwesome5 name="fire" size={scale(12)} color={profile.currentStreak > 0 ? "#fff" : colors.textSecondary} />
        <Text style={{ color: profile.currentStreak > 0 ? '#fff' : colors.textSecondary, fontWeight: 'bold', fontSize: scale(12), marginLeft: scale(4) }}>
          {profile.currentStreak || 0}
        </Text>
      </View>
    </View>
    <Text style={styles.usernameText}>@{profile.username}</Text>

    <View style={styles.socialStatsRow}>
      <TouchableOpacity
        style={styles.socialStatBox}
        onPress={() => openSocialModal("followers")}
      >
        <Text style={styles.socialStatNumber}>{profile.followersCount}</Text>
        <Text style={styles.socialStatLabel}>{t("profile.followers")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.socialStatBox}
        onPress={() => openSocialModal("following")}
      >
        <Text style={styles.socialStatNumber}>{profile.followingCount}</Text>
        <Text style={styles.socialStatLabel}>{t("profile.following")}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.bioContainer}>
      <Text
        style={[
          styles.bioText,
          {
            color: profile.bio ? colors.textPrimary : colors.textSecondary,
            fontStyle: profile.bio ? "normal" : "italic",
          },
        ]}
      >
        {profile.bio ? profile.bio : t("profile.defaultBio")}
      </Text>
    </View>

    <View style={styles.actionButtonContainer}>
      {profile.isOwnProfile ? (
        <ClayCard
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => router.navigate("/(tabs)/profile")}
        >
          <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
            {t("profile.editProfile")}
          </Text>
        </ClayCard>
      ) : profile.hasPendingRequestFromThem ? (
        <View style={styles.followRequestContainer}>
          <ClayCard
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => profile.handleFollowRequest(profileId!, true)}
            color={colors.primary}
          >
            <Text style={[styles.actionButtonText, styles.buttonTextWhite]}>
              {t("social.accept")}
            </Text>
          </ClayCard>
          <ClayCard
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => profile.handleFollowRequest(profileId!, false)}
            color={colors.surface}
          >
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
              {t("social.reject")}
            </Text>
          </ClayCard>
        </View>
      ) : (
        <ClayCard
          style={styles.actionButton}
          color={
            profile.followStatus !== "none"
              ? colors.surface
              : colors.primary
          }
          onPress={handleToggleFollow}
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color:
                  profile.followStatus !== "none" ? colors.textPrimary : "#FFF",
              },
            ]}
          >
            {profile.followStatus === "following"
              ? t("social.following")
              : profile.followStatus === "pending"
                ? t("social.requested")
                : t("social.follow")}
          </Text>
        </ClayCard>
      )}
    </View>
  </View>
  );
};

/**
 * Componente de pestañas segmentadas para alternar entre las secciones de rutinas, packs y historial en el perfil de usuario. Resalta la pestaña activa y permite cambiarla mediante botones táctiles.
 * @param param0
 * @returns
 */
export const SegmentedTabs = ({
  activeTab,
  setActiveTab,
  styles,
  colors,
}: any) => (
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
        size={scale(22)}
        color={activeTab === "routines" ? colors.primary : colors.textSecondary}
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
        size={scale(22)}
        color={activeTab === "packs" ? colors.primary : colors.textSecondary}
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
        size={scale(22)}
        color={activeTab === "history" ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.segmentButton,
        activeTab === "achievements" && styles.segmentButtonActive,
      ]}
      onPress={() => setActiveTab("achievements")}
    >
      <Feather
        name="award"
        size={scale(22)}
        color={activeTab === "achievements" ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
  </View>
);

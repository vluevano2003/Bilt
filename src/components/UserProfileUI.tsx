import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

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
      { justifyContent: "space-between", paddingTop: insets.top + 10 },
    ]}
  >
    <TouchableOpacity onPress={onBack} style={styles.iconButton}>
      <Feather name="arrow-left" size={28} color={colors.textPrimary} />
    </TouchableOpacity>
    <View style={styles.headerRightIcons}>
      {showActions && (
        <TouchableOpacity style={styles.iconButton} onPress={onShare}>
          <Feather name="share" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.iconButton} onPress={onOptions}>
        <Feather name="more-vertical" size={24} color={colors.textPrimary} />
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
    <Feather name={icon} size={60} color={colors.textSecondary} />
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
}: any) => (
  <View style={styles.centeredProfileInfo}>
    <View style={styles.avatarContainer}>
      {profile.profilePic ? (
        <Image
          source={{ uri: profile.profilePic }}
          style={styles.avatarImage}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <AntDesign name="user" size={45} color={colors.textSecondary} />
        </View>
      )}
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
        {profile.bio
          ? profile.bio
          : t(
              "profile.defaultBio",
              "Este usuario aún no ha agregado una presentación.",
            )}
      </Text>
    </View>

    <View style={styles.actionButtonContainer}>
      {profile.hasPendingRequestFromThem ? (
        <View style={styles.followRequestContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => profile.handleFollowRequest(profileId!, true)}
          >
            <Text style={[styles.actionButtonText, styles.buttonTextWhite]}>
              {t("social.accept")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => profile.handleFollowRequest(profileId!, false)}
          >
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
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
        </TouchableOpacity>
      )}
    </View>
  </View>
);

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
        size={22}
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
        size={22}
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
        size={22}
        color={activeTab === "history" ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
  </View>
);

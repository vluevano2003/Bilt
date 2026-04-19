import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SocialUser } from "../../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getStyles } from "../styles/Profile.styles";
import {
  calculateTotalVolume,
  formatDuration,
  getConvertedWeight,
} from "../utils/profileHelpers";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

/**
 * Modal para mostrar la lista de seguidores o seguidos de un usuario
 * @param param0
 * @returns
 */
export const SocialListModal = ({
  visible,
  type,
  data,
  loading,
  onClose,
}: any) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: SocialUser }) => (
    <TouchableOpacity
      style={styles.socialListItem}
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
          <AntDesign
            name="user"
            size={scale(20)}
            color={colors.textSecondary}
          />
        </View>
      )}
      <Text style={styles.socialListUsername}>@{item.username}</Text>
      <Feather
        name="chevron-right"
        size={scale(20)}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: "70%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {type === "followers"
                ? t("profile.followers")
                : t("profile.following")}
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
          ) : data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(
                  verticalScale(60),
                  insets.bottom + verticalScale(20),
                ),
              }}
            />
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: verticalScale(40),
              }}
            >
              {t("social.noResults")}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para mostrar los detalles de un Weekly Pack, incluyendo las rutinas que contiene y la opción de guardarlo o removerlo del perfil
 * @param param0
 * @returns
 */
export const PackDetailsModal = ({
  visible,
  pack,
  userRoutines,
  isSaving,
  isSaved,
  onToggleSave,
  onClose,
}: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  if (!pack) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { maxHeight: "85%", paddingHorizontal: scale(20) },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pack.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(
                verticalScale(80),
                insets.bottom + verticalScale(40),
              ),
            }}
          >
            {pack.description ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  marginBottom: verticalScale(20),
                  fontSize: moderateScale(15),
                }}
              >
                {pack.description}
              </Text>
            ) : null}
            <Text style={[styles.label, { marginBottom: verticalScale(15) }]}>
              {t("weeklyPacks.routinesIncluded")}
            </Text>
            {pack.routineIds.map((rId: string) => {
              const routine = userRoutines.find((r: any) => r.id === rId);
              if (!routine) return null;
              const exercisesPreview =
                routine.exercises
                  ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                  .join(", ") || t("routines.noExercises");
              return (
                <View
                  key={routine.id}
                  style={[
                    styles.routineCard,
                    {
                      padding: scale(15),
                      marginBottom: verticalScale(15),
                      flexDirection: "column",
                      alignItems: "flex-start",
                    },
                  ]}
                >
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text
                    style={{
                      fontSize: moderateScale(14),
                      color: colors.textSecondary,
                      lineHeight: moderateScale(20),
                    }}
                    numberOfLines={2}
                  >
                    {exercisesPreview}
                  </Text>
                </View>
              );
            })}
            <View style={{ marginTop: verticalScale(20) }}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isSaved ? colors.surface : colors.primary,
                    borderColor: isSaved ? colors.border : colors.primary,
                    flexDirection: "row",
                    justifyContent: "center",
                    paddingVertical: verticalScale(12),
                  },
                ]}
                onPress={onToggleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator
                    color={isSaved ? colors.primary : "#FFF"}
                  />
                ) : (
                  <>
                    <FontAwesome
                      name={isSaved ? "bookmark" : "bookmark-o"}
                      size={scale(18)}
                      color={isSaved ? colors.textPrimary : "#FFF"}
                      style={{ marginRight: scale(10) }}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: isSaved ? colors.textPrimary : "#FFF" },
                      ]}
                    >
                      {isSaved
                        ? t("routines.removeFromProfile")
                        : t("weeklyPacks.savePackToProfile")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para mostrar los detalles de una rutina guardada o de una rutina del historial, incluyendo sus ejercicios y sets, y en el caso de las rutinas guardadas, la opción de removerla del perfil
 * @param param0
 * @returns
 */
export const ItemDetailsModal = ({
  visible,
  type,
  item,
  isSaved,
  system,
  onToggleSave,
  onClose,
}: any) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { alignItems: "flex-start" }]}>
            <View style={{ flex: 1, paddingRight: scale(15) }}>
              <Text style={styles.modalTitle}>
                {type === "routine" ? item.name : item.routineName}
              </Text>

              {type === "history" && item.completedAt && (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: moderateScale(14),
                    marginTop: verticalScale(4),
                  }}
                >
                  {new Date(item.completedAt).toLocaleDateString(
                    i18n.language.includes("es") ? "es-ES" : "en-US",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: scale(5), marginRight: scale(-5) }}
            >
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(
                verticalScale(80),
                insets.bottom + verticalScale(40),
              ),
            }}
          >
            {type === "history" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: scale(20),
                  marginBottom: verticalScale(25),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: scale(6),
                  }}
                >
                  <Feather
                    name="clock"
                    size={scale(16)}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: moderateScale(15),
                      fontWeight: "500",
                    }}
                  >
                    {formatDuration(item.durationSeconds)} min
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: scale(6),
                  }}
                >
                  <Feather
                    name="activity"
                    size={scale(16)}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: moderateScale(15),
                      fontWeight: "500",
                    }}
                  >
                    {calculateTotalVolume(item, system)}{" "}
                    {system === "metric" ? "kg" : "lbs"}
                  </Text>
                </View>
              </View>
            )}

            <Text
              style={[
                styles.label,
                {
                  marginBottom: verticalScale(15),
                  color: colors.textPrimary,
                  fontSize: moderateScale(16),
                },
              ]}
            >
              {t("routines.exercises")}:
            </Text>

            {item.exercises?.map((exercise: any, index: number) => {
              const exerciseName =
                exercise.exerciseDetails?.id
                  ?.replace(/_/g, " ")
                  ?.replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                "Ejercicio";
              return (
                <View
                  key={index}
                  style={{
                    marginBottom: verticalScale(25),
                    paddingLeft: scale(5),
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: moderateScale(16),
                      fontWeight: "bold",
                      marginBottom: verticalScale(10),
                    }}
                  >
                    • {exerciseName}
                  </Text>

                  {type === "history" ? (
                    exercise.sets?.map((set: any, setIdx: number) => {
                      const convertedWeight = Math.round(
                        getConvertedWeight(set.weight, set.weightUnit, system),
                      );
                      const displayUnit =
                        set.weightUnit === "bars"
                          ? "bars"
                          : system === "metric"
                            ? "kg"
                            : "lbs";
                      return (
                        <Text
                          key={setIdx}
                          style={{
                            color: colors.textSecondary,
                            marginLeft: scale(15),
                            fontSize: moderateScale(14),
                            marginBottom: verticalScale(6),
                          }}
                        >
                          Set {setIdx + 1}: {set.reps} reps x {convertedWeight}{" "}
                          {displayUnit}
                        </Text>
                      );
                    })
                  ) : (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginLeft: scale(15),
                        fontSize: moderateScale(14),
                      }}
                    >
                      {exercise.sets?.length || 0}{" "}
                      {exercise.sets?.length === 1 ? "Set" : "Sets"}
                    </Text>
                  )}
                </View>
              );
            })}

            {type === "routine" && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    marginTop: verticalScale(30),
                    backgroundColor: isSaved ? colors.surface : colors.primary,
                    borderColor: isSaved ? colors.border : colors.primary,
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                ]}
                onPress={onToggleSave}
              >
                <FontAwesome
                  name={isSaved ? "bookmark" : "bookmark-o"}
                  size={scale(18)}
                  color={isSaved ? colors.textPrimary : "#FFF"}
                  style={{ marginRight: scale(10) }}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isSaved ? colors.textPrimary : "#FFF" },
                  ]}
                >
                  {isSaved
                    ? t("routines.removeFromProfile")
                    : t("routines.saveToProfile")}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

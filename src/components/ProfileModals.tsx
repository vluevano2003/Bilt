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
import { SocialUser } from "../../hooks/useProfile";
import { auth } from "../config/firebase";
import { colors } from "../constants/theme";
import { styles } from "../styles/Profile.styles";
import {
    calculateTotalVolume,
    formatDuration,
    getConvertedWeight,
} from "../utils/profileHelpers";

/**
 * Modal para mostrar listas de seguidores o seguidos en el perfil de usuario
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

  const renderItem = ({ item }: { item: SocialUser }) => (
    <TouchableOpacity
      style={styles.socialListItem}
      onPress={() => {
        onClose();
        if (item.id !== auth.currentUser?.uid)
          router.push({ pathname: "/userProfile", params: { id: item.id } });
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
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 50 }}
            />
          ) : data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
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
  );
};

/**
 * Modal para mostrar detalles de un Pack Semanal, incluyendo las rutinas que contiene y la opción de guardarlo o removerlo del perfil
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
            { maxHeight: "85%", paddingHorizontal: 20 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pack.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {pack.description ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  marginBottom: 20,
                  fontSize: 15,
                }}
              >
                {pack.description}
              </Text>
            ) : null}
            <Text style={[styles.label, { marginBottom: 15 }]}>
              {t("weeklyPacks.routinesIncluded", "Rutinas en este Pack:")}
            </Text>
            {pack.routineIds.map((rId: string) => {
              const routine = userRoutines.find((r: any) => r.id === rId);
              if (!routine) return null;
              const exercisesPreview =
                routine.exercises
                  ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                  .join(", ") || t("routines.noExercises", "Sin ejercicios");
              return (
                <View
                  key={routine.id}
                  style={[
                    styles.routineCard,
                    {
                      padding: 15,
                      marginBottom: 15,
                      flexDirection: "column",
                      alignItems: "flex-start",
                    },
                  ]}
                >
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      lineHeight: 20,
                    }}
                    numberOfLines={2}
                  >
                    {exercisesPreview}
                  </Text>
                </View>
              );
            })}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isSaved ? colors.surface : colors.primary,
                    borderColor: isSaved ? colors.border : colors.primary,
                    flexDirection: "row",
                    justifyContent: "center",
                    paddingVertical: 12,
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
                      size={18}
                      color={isSaved ? colors.textPrimary : "#FFF"}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: isSaved ? colors.textPrimary : "#FFF" },
                      ]}
                    >
                      {isSaved
                        ? t(
                            "routines.removeFromProfile",
                            "Remover de mi perfil",
                          )
                        : t(
                            "weeklyPacks.savePackToProfile",
                            "Guardar Pack en mi Perfil",
                          )}
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
 * Modal para mostrar detalles de una rutina guardada o de un entrenamiento histórico, incluyendo ejercicios, sets, y la opción de guardar o remover la rutina del perfil (solo para rutinas guardadas)
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
  const { t } = useTranslation();
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {type === "routine" ? item.name : item.routineName}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {type === "history" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginBottom: 20,
                  padding: 10,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  <Feather name="clock" size={16} />{" "}
                  {formatDuration(item.durationSeconds)} min
                </Text>
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  <Feather name="activity" size={16} />{" "}
                  {calculateTotalVolume(item, system)}{" "}
                  {system === "metric" ? "kg" : "lbs"}
                </Text>
              </View>
            )}
            <Text style={[styles.label, { marginBottom: 10 }]}>
              {t("routines.exercises")}:
            </Text>
            {item.exercises?.map((exercise: any, index: number) => {
              const exerciseName =
                exercise.exerciseDetails?.id
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                "Ejercicio";
              return (
                <View key={index} style={{ marginBottom: 15, paddingLeft: 10 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "bold",
                      marginBottom: 5,
                    }}
                  >
                    • {exerciseName}
                  </Text>
                  {exercise.sets?.map((set: any, setIdx: number) => {
                    if (type === "history") {
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
                            marginLeft: 15,
                            fontSize: 14,
                          }}
                        >
                          Set {setIdx + 1}: {set.reps} reps x {convertedWeight}{" "}
                          {displayUnit}
                        </Text>
                      );
                    }
                    return (
                      <Text
                        key={setIdx}
                        style={{
                          color: colors.textSecondary,
                          marginLeft: 15,
                          fontSize: 14,
                        }}
                      >
                        Set {setIdx + 1}: {set.reps} reps
                      </Text>
                    );
                  })}
                </View>
              );
            })}
            {type === "routine" && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    marginTop: 30,
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
                  size={18}
                  color={isSaved ? colors.textPrimary : "#FFF"}
                  style={{ marginRight: 10 }}
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

import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { Tabs, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SocialUser, useProfile } from "../../hooks/useProfile";
import { useRoutineEditor } from "../../hooks/useRoutineEditor";
import { useRoutines } from "../../hooks/useRoutines";
import { useRoutinesActions } from "../../hooks/useRoutinesActions";
import { useUserActivity } from "../../hooks/useUserActivity";
import { useWeeklyPacks, WeeklyPack } from "../../hooks/useWeeklyPacks";
import { ExerciseSelectorModal } from "../../src/components/ExerciseSelectorModal";
import { NotificationModal } from "../../src/components/NotificationModal";
import {
  CreatePackModal,
  PackDetailsModal,
  ReadonlyRoutineModal,
  RoutineEditorModal,
} from "../../src/components/RoutinesModals";
import { auth } from "../../src/config/firebase";
import { colors } from "../../src/constants/theme";
import { useActiveWorkout } from "../../src/context/ActiveWorkoutContext";
import { homeStyles } from "../../src/styles/Home.styles";
import { styles as routineStyles } from "../../src/styles/Routines.styles";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    isPrivate,
    pendingRequestsCount,
    getSocialList,
    handleFollowRequest,
    username,
  } = useProfile();

  const { userHistory, isLoadingActivity } = useUserActivity(
    auth.currentUser?.uid,
  );
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [requestsList, setRequestsList] = useState<SocialUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const { routines, isLoading, isSaving, saveRoutine, deleteRoutine } =
    useRoutines();
  const { startWorkout, activeRoutine } = useActiveWorkout();
  const editor = useRoutineEditor(saveRoutine);
  const { packs, isLoadingPacks, isSavingPack, saveWeeklyPack, deletePack } =
    useWeeklyPacks();
  const actions = useRoutinesActions(
    packs,
    deleteRoutine,
    deletePack,
    saveWeeklyPack,
    editor.closeRoutineModal,
  );

  const [activeTab, setActiveTab] = useState<"own" | "saved" | "packs">("own");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedReadonlyRoutine, setSelectedReadonlyRoutine] =
    useState<any>(null);
  const [packDetailsModalVisible, setPackDetailsModalVisible] = useState(false);
  const [selectedPack, setSelectedPack] = useState<WeeklyPack | null>(null);

  useEffect(() => {
    if (params.openNotifications === "true") openNotifications();
  }, [params.openNotifications]);

  const totalWorkouts = userHistory?.length || 0;

  const openNotifications = async () => {
    setNotificationsVisible(true);
    setLoadingRequests(true);
    const users = await getSocialList("requests");
    setRequestsList(users);
    setLoadingRequests(false);
  };

  /**
   * Maneja el inicio de un entrenamiento. Si ya hay una rutina activa, muestra una alerta
   * @param routine
   */
  const handleStartWorkout = (routine: any) => {
    if (activeRoutine && activeRoutine.id === routine.id) {
      router.push("/activeWorkout");
    } else if (activeRoutine) {
      Alert.alert(
        t("activeWorkout.workoutInProgressTitle"),
        t("activeWorkout.workoutInProgressMsg"),
      );
    } else {
      startWorkout(routine);
      router.push("/activeWorkout");
    }
  };

  /**
   * Devuelve un saludo basado en la hora del día
   * @returns
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.morning", "Buenos días");
    if (hour < 19) return t("home.afternoon", "Buenas tardes");
    return t("home.evening", "Buenas noches");
  };

  /**
   * Calcula los días de la semana en los que el usuario ha entrenado, basándose en su historial de actividad
   * @returns
   */
  const getTrainingDaysThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const trainedDays = new Set();

    userHistory?.forEach((session: any) => {
      const rawTime =
        session.createdAt ||
        session.endTime ||
        session.timestamp ||
        session.date;
      let sessionDate = new Date();

      if (rawTime) {
        if (typeof rawTime === "number") {
          sessionDate = new Date(rawTime);
        } else if (typeof rawTime.toDate === "function") {
          sessionDate = rawTime.toDate();
        } else if (rawTime.seconds) {
          sessionDate = new Date(rawTime.seconds * 1000);
        } else {
          sessionDate = new Date(rawTime);
        }
      }

      if (!isNaN(sessionDate.getTime()) && sessionDate >= startOfWeek) {
        const sessionDay =
          sessionDate.getDay() === 0 ? 6 : sessionDate.getDay() - 1;
        trainedDays.add(sessionDay);
      }
    });

    return trainedDays;
  };

  if (isLoading || isLoadingPacks || isLoadingActivity) {
    return (
      <View style={[homeStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayedRoutines =
    activeTab === "own"
      ? routines.filter((r) => !r.originalCreatorId)
      : routines.filter((r) => r.originalCreatorId);

  const DashboardHeader = () => {
    const greeting = getGreeting();
    const trainedDays = getTrainingDaysThisWeek();
    const daysLabel = i18n.language.includes("es")
      ? ["L", "M", "M", "J", "V", "S", "D"]
      : ["M", "T", "W", "T", "F", "S", "S"];

    return (
      <View style={{ paddingBottom: 15 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 10,
            marginBottom: 25,
          }}
        >
          <Text
            style={[homeStyles.title, { fontSize: 26, color: colors.primary }]}
          >
            {greeting},{" "}
          </Text>
          <Text
            style={[
              homeStyles.title,
              { fontSize: 26, color: colors.textPrimary },
            ]}
          >
            {username || t("profile.profileOf", "Atleta")}!
          </Text>
        </View>

        <View style={[homeStyles.card, { marginBottom: 25 }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Feather
              name="bar-chart-2"
              size={20}
              color={colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={homeStyles.cardTitle}>{t("home.weeklySummary")}</Text>
          </View>

          <View style={homeStyles.statsRow}>
            <View
              style={[
                homeStyles.statBox,
                { flex: 0.8, justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={[homeStyles.statNumber, { textAlign: "center" }]}>
                {totalWorkouts}
              </Text>
              <Text
                style={[
                  homeStyles.statLabel,
                  { textAlign: "center", fontSize: 12 },
                ]}
              >
                {t("home.workouts")}
              </Text>
            </View>

            <View style={homeStyles.divider} />

            <View
              style={[
                homeStyles.statBox,
                { flex: 2.2, justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text
                style={[
                  homeStyles.statLabel,
                  { marginBottom: 8, marginTop: 0, textAlign: "center" },
                ]}
              >
                {t("home.thisWeek", "Esta semana")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                {daysLabel.map((day, idx) => {
                  const isTrained = trainedDays.has(idx);
                  return (
                    <View
                      key={idx}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isTrained
                          ? colors.primary
                          : colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: isTrained ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "bold",
                          color: isTrained ? "#FFF" : colors.textSecondary,
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={routineStyles.tabsContainer}>
          <TouchableOpacity
            style={[
              routineStyles.tab,
              activeTab === "own" && routineStyles.activeTab,
            ]}
            onPress={() => setActiveTab("own")}
          >
            <Text
              style={[
                routineStyles.tabText,
                activeTab === "own" && routineStyles.activeTabText,
              ]}
            >
              {t("routines.title")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              routineStyles.tab,
              activeTab === "packs" && routineStyles.activeTab,
            ]}
            onPress={() => setActiveTab("packs")}
          >
            <Text
              style={[
                routineStyles.tabText,
                activeTab === "packs" && routineStyles.activeTabText,
              ]}
            >
              {t("weeklyPacks.tabPacks", "Packs")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              routineStyles.tab,
              activeTab === "saved" && routineStyles.activeTab,
            ]}
            onPress={() => setActiveTab("saved")}
          >
            <Text
              style={[
                routineStyles.tabText,
                activeTab === "saved" && routineStyles.activeTabText,
              ]}
            >
              {t("routines.savedRoutines", "Guardadas")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={homeStyles.container}>
      <Tabs.Screen
        options={{
          title: t("tabs.workout", "Entrenar"),
          headerTitle: t("tabs.workout", "Entrenar"),
          headerRight: () => (
            <TouchableOpacity
              style={{
                paddingRight: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={openNotifications}
            >
              <Feather name="bell" size={24} color={colors.textPrimary} />
              {isPrivate && pendingRequestsCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: 14,
                    backgroundColor: "#EF4444",
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}
                  >
                    {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {activeTab === "packs" ? (
        <FlatList
          ListHeaderComponent={DashboardHeader}
          data={packs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            routineStyles.listContainer,
            { paddingHorizontal: 20 },
          ]}
          ListEmptyComponent={
            <View style={routineStyles.emptyState}>
              <Feather name="layers" size={60} color={colors.textSecondary} />
              <Text style={routineStyles.emptyText}>
                {t(
                  "weeklyPacks.emptyMessage",
                  "Aún no tienes packs semanales.",
                )}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={routineStyles.routineCard}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedPack(item);
                setPackDetailsModalVisible(true);
              }}
            >
              <View style={routineStyles.cardHeader}>
                <Text style={routineStyles.routineName}>{item.name}</Text>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              {item.originalCreatorId && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <FontAwesome
                    name="bookmark"
                    size={12}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {t("routines.fromCreator", {
                      creator: item.originalCreatorName,
                    })}
                  </Text>
                </View>
              )}
              {item.description ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginBottom: 12,
                    marginTop: 4,
                  }}
                >
                  {item.description}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather
                  name="list"
                  size={14}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  {item.routineIds.length} {t("routines.exercises", "Rutinas")}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          ListHeaderComponent={DashboardHeader}
          data={displayedRoutines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            routineStyles.listContainer,
            { paddingHorizontal: 20 },
          ]}
          ListEmptyComponent={
            <View style={routineStyles.emptyState}>
              <Feather
                name="clipboard"
                size={60}
                color={colors.textSecondary}
              />
              <Text style={routineStyles.emptyText}>
                {t("routines.emptyMessage")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const exercisesPreview =
              item.exercises
                ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                .join(", ") || t("routines.noExercises");
            return (
              <View style={routineStyles.routineCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.originalCreatorId) {
                      setSelectedReadonlyRoutine(item);
                      setDetailsModalVisible(true);
                    } else {
                      editor.openRoutineModal(item);
                    }
                  }}
                >
                  <View style={routineStyles.cardHeader}>
                    <Text style={routineStyles.routineName}>{item.name}</Text>
                    <Feather
                      name="more-horizontal"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                  {item.originalCreatorId && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <FontAwesome
                        name="bookmark"
                        size={12}
                        color={colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.primary,
                          fontWeight: "bold",
                        }}
                      >
                        {t("routines.fromCreator", {
                          creator: item.originalCreatorName,
                        })}
                      </Text>
                    </View>
                  )}
                  <Text style={routineStyles.exercisePreview} numberOfLines={2}>
                    {exercisesPreview}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={routineStyles.startRoutineButton}
                  onPress={() => handleStartWorkout(item)}
                >
                  <Text style={routineStyles.startRoutineText}>
                    {t("routines.startWorkout")}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {!activeRoutine && (
        <TouchableOpacity
          style={[routineStyles.fab, { bottom: 30 }]}
          onPress={() =>
            activeTab === "packs"
              ? actions.setPackModalVisible(true)
              : editor.openRoutineModal()
          }
        >
          <AntDesign name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      <NotificationModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        loading={loadingRequests}
        requestsList={requestsList}
        onHandleRequest={(id: string, accept: boolean) => {
          handleFollowRequest(id, accept);
          setRequestsList((prev) => prev.filter((u) => u.id !== id));
        }}
      />
      <CreatePackModal
        visible={actions.packModalVisible}
        onClose={() => actions.setPackModalVisible(false)}
        packName={actions.packName}
        setPackName={actions.setPackName}
        packDescription={actions.packDescription}
        setPackDescription={actions.setPackDescription}
        selectedRoutineIds={actions.selectedRoutineIds}
        toggleRoutineSelection={actions.toggleRoutineSelection}
        routines={routines}
        handleCreatePack={actions.handleCreatePack}
        isSavingPack={isSavingPack}
      />
      <PackDetailsModal
        visible={packDetailsModalVisible}
        onClose={() => setPackDetailsModalVisible(false)}
        pack={selectedPack}
        routines={routines}
        handleDeletePack={(id: string) =>
          actions.handleDeletePack(id, () => setPackDetailsModalVisible(false))
        }
        startWorkoutAndClose={(r: any) => {
          setPackDetailsModalVisible(false);
          handleStartWorkout(r);
        }}
      />
      <ReadonlyRoutineModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        routine={selectedReadonlyRoutine}
        handleUnsave={(id: string) =>
          actions.handleUnsaveRoutine(id, () => setDetailsModalVisible(false))
        }
      />
      <RoutineEditorModal
        editor={editor}
        isSaving={isSaving}
        handleDelete={(id: string) =>
          actions.handleDelete(id, () => setDetailsModalVisible(false))
        }
      />
      <ExerciseSelectorModal
        visible={editor.exerciseModalVisible}
        onClose={() => editor.setExerciseModalVisible(false)}
        searchQuery={editor.searchQuery}
        setSearchQuery={editor.setSearchQuery}
        selectedMuscle={editor.selectedMuscle}
        setSelectedMuscle={editor.setSelectedMuscle}
        uniqueMuscles={editor.uniqueMuscles}
        filteredExercises={editor.filteredExercises}
        tempSelectedExercises={editor.tempSelectedExercises}
        toggleExerciseSelection={editor.toggleExerciseSelection}
        onConfirm={editor.confirmSelectedExercises}
      />
    </View>
  );
}

import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import {
  Tabs,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Platform,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SocialUser, useProfile } from "../../hooks/useProfile";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useRoutineEditor } from "../../hooks/useRoutineEditor";
import { useRoutines } from "../../hooks/useRoutines";
import { useRoutinesActions } from "../../hooks/useRoutinesActions";
import { useUserActivity } from "../../hooks/useUserActivity";
import { useWeeklyPacks, WeeklyPack } from "../../hooks/useWeeklyPacks";
import { ExerciseSelectorModal } from "../../src/components/ExerciseSelectorModal";
import { FeedbackModal } from "../../src/components/FeedbackModal";
import { NotificationModal } from "../../src/components/NotificationModal";
import {
  CreatePackModal,
  PackDetailsModal,
  ReadonlyRoutineModal,
  RoutineEditorModal,
} from "../../src/components/RoutinesModals";
import { useActiveWorkout } from "../../src/context/ActiveWorkoutContext";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getHomeStyles } from "../../src/styles/Home.styles";
import { getStyles as getRoutineStyles } from "../../src/styles/Routines.styles";

/**
 * Componentes para acciones del header (feedback y notificaciones) y el header del dashboard (saludo, resumen semanal y tabs de rutinas). Se definen fuera del componente principal para evitar re-renderizados innecesarios al cambiar de tab o al abrir modales.
 * @param param0
 * @returns
 */
const HeaderRightActions = ({
  colors,
  styles,
  isPrivate,
  pendingRequestsCount,
  onOpenFeedback,
  onOpenNotifications,
}: any) => (
  <View style={styles.headerRightContainer}>
    <TouchableOpacity onPress={onOpenFeedback}>
      <Feather name="message-square" size={24} color={colors.textPrimary} />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.notificationIconContainer}
      onPress={onOpenNotifications}
    >
      <Feather name="bell" size={24} color={colors.textPrimary} />
      {isPrivate && pendingRequestsCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

/**
 * Componente del header del dashboard, con saludo personalizado, resumen semanal y tabs para cambiar entre rutinas propias, guardadas y packs semanales. Se define fuera del componente principal para evitar re-renderizados innecesarios al cambiar de tab o al abrir modales.
 * @param param0
 * @returns
 */
const DashboardHeader = ({
  t,
  i18n,
  colors,
  homeStyles,
  routineStyles,
  username,
  totalWorkouts,
  trainedDays,
  activeTab,
  setActiveTab,
}: any) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.morning", "Buenos días");
    if (hour < 19) return t("home.afternoon", "Buenas tardes");
    return t("home.evening", "Buenas noches");
  };

  const daysLabel = i18n.language.includes("es")
    ? ["L", "M", "M", "J", "V", "S", "D"]
    : ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <View style={homeStyles.dashboardPadding}>
      <View style={homeStyles.greetingContainer}>
        <Text style={homeStyles.greetingText}>{getGreeting()}, </Text>
        <Text style={homeStyles.usernameText}>
          {username || t("home.defaultName", "Atleta")}!
        </Text>
      </View>

      <View style={homeStyles.card}>
        <View style={homeStyles.weeklySummaryHeader}>
          <Feather
            name="bar-chart-2"
            size={20}
            color={colors.textPrimary}
            style={homeStyles.weeklySummaryIcon}
          />
          <Text style={homeStyles.cardTitle}>{t("home.weeklySummary")}</Text>
        </View>
        <View style={homeStyles.statsRow}>
          <View style={homeStyles.statBoxLeft}>
            <Text style={homeStyles.statNumber}>{totalWorkouts}</Text>
            <Text style={homeStyles.statLabelSmall}>{t("home.workouts")}</Text>
          </View>
          <View style={homeStyles.divider} />
          <View style={homeStyles.statBoxRight}>
            <Text
              style={[homeStyles.statLabel, homeStyles.statLabelMarginBottom]}
            >
              {t("home.thisWeek", "Esta semana")}
            </Text>
            <View style={homeStyles.daysContainer}>
              {daysLabel.map((day, idx) => {
                const isTrained = trainedDays.has(idx);
                return (
                  <View
                    key={idx}
                    style={[
                      homeStyles.dayBadge,
                      {
                        backgroundColor: isTrained
                          ? colors.primary
                          : colors.background,
                        borderColor: isTrained ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        homeStyles.dayBadgeText,
                        { color: isTrained ? "#FFF" : colors.textSecondary },
                      ]}
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

/**
 * Pantalla principal del tab de entrenamiento, con dashboard personalizado, lista de rutinas y packs semanales, y acceso a modales de detalles, edición, creación de packs, feedback y notificaciones. Maneja la lógica de inicio de workout, cambio entre tabs y carga de datos iniciales.
 * @returns
 */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  usePushNotifications(user?.id);
  const insets = useSafeAreaInsets();

  const homeStyles = getHomeStyles(colors);
  const routineStyles = getRoutineStyles(colors);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      let backPressCount = 0;

      const onBackPress = () => {
        if (backPressCount === 1) {
          BackHandler.exitApp();
          return true;
        }

        backPressCount = 1;
        ToastAndroid.show(
          t("common.pressBackAgain", "Presiona atrás de nuevo para salir"),
          ToastAndroid.SHORT,
        );

        setTimeout(() => {
          backPressCount = 0;
        }, 2000);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [t]),
  );

  const {
    isPrivate,
    pendingRequestsCount,
    getSocialList,
    handleFollowRequest,
    username,
  } = useProfile();
  const { userHistory, isLoadingActivity } = useUserActivity(user?.id);

  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [requestsList, setRequestsList] = useState<SocialUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const {
    routines,
    exercisesDb,
    isLoading,
    isSaving,
    saveRoutine,
    deleteRoutine,
  } = useRoutines();
  const { startWorkout, activeRoutine } = useActiveWorkout();
  const editor = useRoutineEditor(saveRoutine, exercisesDb);
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

  const handleStartWorkout = (routine: any) => {
    if (activeRoutine && activeRoutine.id === routine.id) {
      router.push("/activeWorkout");
    } else if (activeRoutine) {
      Alert.alert(
        t("activeWorkout.workoutInProgressTitle"),
        t("activeWorkout.workoutInProgressMsg"),
      );
    } else {
      let routineToStart = routine;
      if (routine.originalCreatorId) {
        routineToStart = {
          ...routine,
          exercises: routine.exercises.map((ex: any) => ({
            ...ex,
            sets: ex.sets.map((set: any) => ({
              ...set,
              weight: 0,
              reps: 0,
            })),
          })),
        };
      }
      startWorkout(routineToStart);
      router.push("/activeWorkout");
    }
  };

  const getTrainingDaysThisWeek = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const trainedDays = new Set();
    userHistory?.forEach((session: any) => {
      let sessionDate = new Date();
      if (session.completedAt) sessionDate = new Date(session.completedAt);
      else if (session.createdAt) sessionDate = new Date(session.createdAt);

      if (!isNaN(sessionDate.getTime()) && sessionDate >= startOfWeek) {
        const sessionDay =
          sessionDate.getDay() === 0 ? 6 : sessionDate.getDay() - 1;
        trainedDays.add(sessionDay);
      }
    });
    return trainedDays;
  }, [userHistory]);

  if (isLoading || isLoadingPacks || isLoadingActivity) {
    return (
      <View style={homeStyles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayedRoutines =
    activeTab === "own"
      ? routines.filter((r) => !r.originalCreatorId)
      : routines.filter((r) => !!r.originalCreatorId);

  return (
    <View style={homeStyles.container}>
      <Tabs.Screen
        options={{
          title: t("tabs.workout", "Entrenar"),
          headerTitle: t("tabs.workout", "Entrenar"),
          headerRight: () => (
            <HeaderRightActions
              colors={colors}
              styles={homeStyles}
              isPrivate={isPrivate}
              pendingRequestsCount={pendingRequestsCount}
              onOpenFeedback={() => setFeedbackModalVisible(true)}
              onOpenNotifications={openNotifications}
            />
          ),
        }}
      />

      <FlatList<any>
        ListHeaderComponent={
          <DashboardHeader
            t={t}
            i18n={i18n}
            colors={colors}
            homeStyles={homeStyles}
            routineStyles={routineStyles}
            username={username}
            totalWorkouts={totalWorkouts}
            trainedDays={getTrainingDaysThisWeek()}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        }
        data={activeTab === "packs" ? packs : displayedRoutines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          routineStyles.listContainer,
          { paddingHorizontal: 20, paddingBottom: 100 + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={routineStyles.emptyState}>
            <Feather
              name={activeTab === "packs" ? "layers" : "clipboard"}
              size={60}
              color={colors.textSecondary}
            />
            <Text style={routineStyles.emptyText}>
              {activeTab === "packs"
                ? t(
                    "weeklyPacks.emptyMessage",
                    "Aún no tienes packs semanales.",
                  )
                : t("routines.emptyMessage")}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === "packs") {
            const packItem = item as WeeklyPack;
            return (
              <TouchableOpacity
                style={routineStyles.routineCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedPack(packItem);
                  setPackDetailsModalVisible(true);
                }}
              >
                <View style={routineStyles.cardHeader}>
                  <Text style={routineStyles.routineName}>{packItem.name}</Text>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                {packItem.originalCreatorId && (
                  <View style={homeStyles.bookmarkContainer}>
                    <FontAwesome
                      name="bookmark"
                      size={12}
                      color={colors.primary}
                      style={homeStyles.bookmarkIcon}
                    />
                    <Text style={homeStyles.creatorText}>
                      {t("routines.fromCreator", {
                        creator: packItem.originalCreatorName,
                      })}
                    </Text>
                  </View>
                )}
                {packItem.description ? (
                  <Text style={homeStyles.packDescription}>
                    {packItem.description}
                  </Text>
                ) : null}
                <View style={homeStyles.packRoutinesContainer}>
                  <Feather
                    name="list"
                    size={14}
                    color={colors.primary}
                    style={homeStyles.packRoutinesIcon}
                  />
                  <Text style={homeStyles.packRoutinesText}>
                    {packItem.routineIds.length}{" "}
                    {t("weeklyPacks.routinesCount", "Rutinas")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          const routineItem = item as any;
          const exercisesPreview =
            routineItem.exercises
              ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
              .join(", ") || t("routines.noExercises");

          return (
            <View style={routineStyles.routineCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  routineItem.originalCreatorId
                    ? (setSelectedReadonlyRoutine(routineItem),
                      setDetailsModalVisible(true))
                    : editor.openRoutineModal(routineItem);
                }}
              >
                <View style={routineStyles.cardHeader}>
                  <Text style={routineStyles.routineName}>
                    {routineItem.name}
                  </Text>
                  <Feather
                    name="more-horizontal"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                {routineItem.originalCreatorId && (
                  <View style={homeStyles.bookmarkContainer}>
                    <FontAwesome
                      name="bookmark"
                      size={12}
                      color={colors.primary}
                      style={homeStyles.bookmarkIcon}
                    />
                    <Text style={homeStyles.creatorText}>
                      {t("routines.fromCreator", {
                        creator: routineItem.originalCreatorName,
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
                onPress={() => handleStartWorkout(routineItem)}
              >
                <Text style={routineStyles.startRoutineText}>
                  {t("routines.startWorkout")}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {!activeRoutine && (
        <TouchableOpacity
          style={[
            routineStyles.fab,
            { bottom: Math.max(30, insets.bottom + 15) },
          ]}
          onPress={() =>
            activeTab === "packs"
              ? actions.setPackModalVisible(true)
              : editor.openRoutineModal()
          }
        >
          <AntDesign name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        userId={user?.id}
        colors={colors}
        homeStyles={homeStyles}
        routineStyles={routineStyles}
        insets={insets}
      />

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

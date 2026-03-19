import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoutineEditor } from "../../hooks/useRoutineEditor";
import { useRoutines } from "../../hooks/useRoutines";
import { useRoutinesActions } from "../../hooks/useRoutinesActions";
import { useWeeklyPacks, WeeklyPack } from "../../hooks/useWeeklyPacks";
import { ExerciseSelectorModal } from "../../src/components/ExerciseSelectorModal";
import {
  CreatePackModal,
  PackDetailsModal,
  ReadonlyRoutineModal,
  RoutineEditorModal,
} from "../../src/components/RoutinesModals";
import { colors } from "../../src/constants/theme";
import { useActiveWorkout } from "../../src/context/ActiveWorkoutContext";
import { styles } from "../../src/styles/Routines.styles";

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { routines, isLoading, isSaving, saveRoutine, deleteRoutine } =
    useRoutines();
  const { startWorkout, activeRoutine } = useActiveWorkout();
  const editor = useRoutineEditor(saveRoutine);
  const { packs, isLoadingPacks, isSavingPack, saveWeeklyPack, deletePack } =
    useWeeklyPacks();
  const [activeTab, setActiveTab] = useState<"own" | "saved" | "packs">("own");
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedReadonlyRoutine, setSelectedReadonlyRoutine] =
    useState<any>(null);
  const [packDetailsModalVisible, setPackDetailsModalVisible] = useState(false);
  const [selectedPack, setSelectedPack] = useState<WeeklyPack | null>(null);

  /**
   * Este hook centraliza todas las acciones relacionadas con rutinas y packs, como creación, edición, eliminación y guardado. De esta forma, mantenemos el componente más limpio y enfocado en la UI, delegando la lógica de negocio a este hook especializado
   */
  const actions = useRoutinesActions(
    packs,
    deleteRoutine,
    deletePack,
    saveWeeklyPack,
    editor.closeRoutineModal,
  );

  if (isLoading || isLoadingPacks) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayedRoutines =
    activeTab === "own"
      ? routines.filter((r) => !r.originalCreatorId)
      : routines.filter((r) => r.originalCreatorId);

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

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "own" && styles.activeTab]}
          onPress={() => setActiveTab("own")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "own" && styles.activeTabText,
            ]}
          >
            {t("routines.title")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "packs" && styles.activeTab]}
          onPress={() => setActiveTab("packs")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "packs" && styles.activeTabText,
            ]}
          >
            {t("weeklyPacks.tabPacks", "Packs")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "saved" && styles.activeTab]}
          onPress={() => setActiveTab("saved")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "saved" && styles.activeTabText,
            ]}
          >
            {t("routines.savedRoutines", "Guardadas")}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "packs" ? (
        <FlatList
          data={packs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="layers" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {t(
                  "weeklyPacks.emptyMessage",
                  "Aún no tienes packs semanales.",
                )}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.routineCard}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedPack(item);
                setPackDetailsModalVisible(true);
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.routineName}>{item.name}</Text>
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
          data={displayedRoutines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather
                name="clipboard"
                size={60}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>{t("routines.emptyMessage")}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const exercisesPreview =
              item.exercises
                ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                .join(", ") || t("routines.noExercises");
            return (
              <View style={styles.routineCard}>
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
                  <View style={styles.cardHeader}>
                    <Text style={styles.routineName}>{item.name}</Text>
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
                  <Text style={styles.exercisePreview} numberOfLines={2}>
                    {exercisesPreview}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startRoutineButton}
                  onPress={() => handleStartWorkout(item)}
                >
                  <Text style={styles.startRoutineText}>
                    {t("routines.startWorkout")}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, activeRoutine ? { bottom: 140 } : { bottom: 30 }]}
        onPress={() =>
          activeTab === "packs"
            ? actions.setPackModalVisible(true)
            : editor.openRoutineModal()
        }
      >
        <AntDesign name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

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

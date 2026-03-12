import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useRoutineEditor } from "../../hooks/useRoutineEditor";
import { RoutineExercise, useRoutines } from "../../hooks/useRoutines";
import { CustomInput } from "../../src/components/CustomInput";
import { ExerciseSelectorModal } from "../../src/components/ExerciseSelectorModal";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { colors } from "../../src/constants/theme";
import { useActiveWorkout } from "../../src/context/ActiveWorkoutContext";
import { styles } from "../../src/styles/RoutinesScreen.styles";

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { routines, isLoading, isSaving, saveRoutine, deleteRoutine } =
    useRoutines();
  const { startWorkout, activeRoutine } = useActiveWorkout();
  const editor = useRoutineEditor(saveRoutine);

  /**
   * Maneja la eliminación de una rutina con confirmación
   * @param routineId
   */
  const handleDelete = (routineId: string) => {
    Alert.alert(
      t("routines.deleteConfirmTitle"),
      t("routines.deleteConfirmMsg"),
      [
        { text: t("routines.cancel"), style: "cancel" },
        {
          text: t("routines.yesDelete"),
          style: "destructive",
          onPress: () => {
            deleteRoutine(routineId);
            editor.closeRoutineModal();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /**
   * Renderiza cada ejercicio dentro de la rutina con capacidad de arrastrar para reordenar, eliminar y agregar series
   * @param param0
   * @returns
   */
  const renderDraggableExercise = ({
    item: routineEx,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<RoutineExercise>) => {
    const index = getIndex() || 0;
    return (
      <ScaleDecorator>
        <View
          style={{
            backgroundColor: isActive ? colors.background : colors.surface,
            padding: 15,
            borderRadius: 10,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: isActive ? colors.primary : colors.border,
            elevation: isActive ? 10 : 0,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {index + 1}. {t(`exercises.${routineEx.exerciseDetails.id}`)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {t(`muscles.${routineEx.exerciseDetails.muscleGroup}`)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => editor.removeExercise(routineEx.id)}
                style={{ padding: 5, marginRight: 10 }}
              >
                <Feather name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                style={{ padding: 5 }}
              >
                <Feather name="menu" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {routineEx.sets.map((set, setIndex) => (
            <View
              key={set.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0,0,0,0.02)",
                padding: 8,
                borderRadius: 6,
                marginBottom: 5,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "500" }}>
                {t("routines.set", "Serie")} {setIndex + 1}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  editor.removeSetFromExercise(routineEx.id, set.id)
                }
                style={{ padding: 5 }}
              >
                <Feather
                  name="minus-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
            }}
            onPress={() => editor.addSetToExercise(routineEx.id)}
          >
            <Feather
              name="plus"
              size={16}
              color={colors.primary}
              style={{ marginRight: 5 }}
            />
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              {t("routines.addSet", "Añadir Serie")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t("routines.title")}</Text>
      </View>

      {/* Lista de Rutinas */}
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t("routines.emptyMessage")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.routineCard}
            onPress={() => editor.openRoutineModal(item)}
          >
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>{item.name}</Text>
              <Text style={styles.routineDetails}>
                {item.exercises?.length || 0} {t("routines.exercises")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => {
                if (activeRoutine && activeRoutine.id === item.id) {
                  router.push("/activeWorkout");
                } else if (activeRoutine) {
                  Alert.alert(
                    t("activeWorkout.workoutInProgressTitle"),
                    t("activeWorkout.workoutInProgressMsg"),
                  );
                } else {
                  startWorkout(item);
                  router.push("/activeWorkout");
                }
              }}
            >
              <Feather name="play" size={20} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, activeRoutine ? { bottom: 140 } : { bottom: 30 }]}
        onPress={() => editor.openRoutineModal()}
      >
        <AntDesign name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/*Modal de creación/edición*/}
      <Modal
        visible={editor.modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={editor.closeRoutineModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { height: "90%", padding: 0 }]}>
              <View
                style={[
                  styles.modalHeader,
                  { paddingHorizontal: 25, paddingTop: 25 },
                ]}
              >
                <Text style={styles.modalTitle}>
                  {editor.editingRoutine
                    ? t("routines.edit")
                    : t("routines.createNew")}
                </Text>
                <TouchableOpacity onPress={editor.closeRoutineModal}>
                  <AntDesign
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <DraggableFlatList
                data={editor.routineExercises}
                onDragEnd={({ data }) => editor.reorderExercises(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderDraggableExercise}
                contentContainerStyle={{
                  paddingHorizontal: 25,
                  paddingBottom: 100,
                }}
                ListHeaderComponent={
                  <View style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>
                      {t("routines.routineName")}
                    </Text>
                    <CustomInput
                      value={editor.routineName}
                      onChangeText={editor.setRoutineName}
                      placeholder={t("routines.routineNamePlaceholder")}
                    />
                    <Text style={[styles.label, { marginTop: 20 }]}>
                      {t("routines.exercises")}
                    </Text>
                    {editor.routineExercises.length === 0 && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontStyle: "italic",
                          marginBottom: 15,
                        }}
                      >
                        {t(
                          "routines.noExercises",
                          "No hay ejercicios agregados.",
                        )}
                      </Text>
                    )}
                  </View>
                }
                ListFooterComponent={
                  <View>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderStyle: "dashed",
                        marginBottom: 20,
                        marginTop: 10,
                      }}
                      onPress={editor.openExerciseSelector}
                    >
                      <Feather
                        name="plus"
                        size={20}
                        color={colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {t("routines.addExercise")}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.buttonsRow}>
                      {editor.editingRoutine && (
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <SecondaryButton
                            title={t("routines.delete")}
                            onPress={() =>
                              handleDelete(editor.editingRoutine!.id)
                            }
                            style={{ borderColor: "#EF4444" }}
                          />
                        </View>
                      )}
                      <View style={{ flex: 2 }}>
                        <PrimaryButton
                          title={t("routines.save")}
                          onPress={editor.handleSaveRoutine}
                          loading={isSaving}
                          disabled={
                            !editor.routineName.trim() ||
                            editor.routineExercises.length === 0
                          }
                        />
                      </View>
                    </View>
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>

      {/*Componente Modularizado de Selección*/}
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

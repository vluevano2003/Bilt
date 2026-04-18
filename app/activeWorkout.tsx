import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { moderateScale, verticalScale } from "../src/utils/Responsive";

import { useActiveWorkoutScreen } from "../hooks/useActiveWorkout";
import {
  ExerciseType,
  RoutineExercise,
  useRoutines,
} from "../hooks/useRoutines";
import { ExerciseListItem } from "../src/components/ExerciseListItem";
import { ExerciseSelectorModal } from "../src/components/ExerciseSelectorModal";
import { ExerciseDetailsModal } from "../src/components/RoutinesModals";
import { WorkoutSummaryModal } from "../src/components/WorkoutSummaryModal";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/ActiveWorkout.styles";

/**
 * Vista principal del entrenamiento activo. Muestra la lista de ejercicios, estadísticas en tiempo real, y maneja toda la lógica de interacción durante el entrenamiento
 * @param param0
 * @returns
 */
const EmptyWorkoutView = ({ router, styles }: any) => (
  <View style={[styles.container, styles.emptyContainer]}>
    <Text style={styles.emptyText}>No hay rutina activa</Text>
    <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn}>
      <Text style={styles.emptyBtnText}>Volver</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Función auxiliar para formatear el tiempo de descanso en formato mm:ss
 * @param seconds
 * @returns
 */
const formatRestTimeStr = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/**
 * Pantalla principal del entrenamiento activo. Muestra la lista de ejercicios, estadísticas en tiempo real, y maneja toda la lógica de interacción durante el entrenamiento
 * @returns
 */
export default function ActiveWorkoutScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { exercisesDb } = useRoutines();

  const {
    t,
    router,
    activeRoutine,
    elapsedSeconds,
    restTimeRemaining,
    isResting,
    showSummary,
    stats,
    muscleDistribution,
    handleSetChange,
    measurementSystem,
    addSetToExercise,
    removeSetFromExercise,
    toggleSetCompletion,
    adjustRestTime,
    stopRestTimer,
    reorderActiveExercises,
    formatTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    updateExerciseRestTime,
    changeExerciseUnit,
    getPreviousSet,
    isSavingHistory,
    addExercisesToActiveRoutine,
    removeExerciseFromActiveRoutine,
  } = useActiveWorkoutScreen();

  const [restEditExId, setRestEditExId] = useState<string | null>(null);
  const [tempRest, setTempRest] = useState(90);
  const [unitModalExId, setUnitModalExId] = useState<string | null>(null);
  const [detailsExercise, setDetailsExercise] = useState<ExerciseType | null>(
    null,
  );
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [tempSelectedExercises, setTempSelectedExercises] = useState<
    ExerciseType[]
  >([]);

  const volumeUnitText = measurementSystem === "metric" ? "kg" : "lbs";

  if (!activeRoutine)
    return <EmptyWorkoutView router={router} styles={styles} />;

  const isReadonly = !!activeRoutine.originalCreatorId;

  const openRestEditor = useCallback((exId: string, currentRest: number) => {
    setRestEditExId(exId);
    setTempRest(currentRest);
  }, []);

  const saveRestTime = () => {
    if (restEditExId) updateExerciseRestTime(restEditExId, tempRest);
    setRestEditExId(null);
  };

  const handleUnitSelect = (unit: any) => {
    if (unitModalExId) changeExerciseUnit(unitModalExId, unit);
    setUnitModalExId(null);
  };

  const openExerciseSelector = () => {
    setSearchQuery("");
    setSelectedMuscle(null);
    setTempSelectedExercises([]);
    setExerciseModalVisible(true);
  };

  const toggleExerciseSelection = (exercise: ExerciseType) => {
    setTempSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === exercise.id);
      if (exists) return prev.filter((e) => e.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  const confirmSelectedExercises = () => {
    const newExercises: RoutineExercise[] = tempSelectedExercises.map((ex) => ({
      id: Math.random().toString(36).substr(2, 9),
      exerciseDetails: ex,
      restTimeSeconds: 90,
      sets: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: "normal",
          reps: 0,
          weight: 0,
          weightUnit: measurementSystem === "metric" ? "kg" : "lbs",
          completed: false,
        },
      ],
    }));
    addExercisesToActiveRoutine(newExercises);
    setExerciseModalVisible(false);
  };

  const filteredExercises = useMemo(() => {
    return exercisesDb.filter((ex) => {
      const exerciseName = t(`exercises.${ex.id}`).toLowerCase();
      const matchesSearch = exerciseName.includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle
        ? ex.muscleGroup === selectedMuscle
        : true;
      return matchesSearch && matchesMuscle;
    });
  }, [searchQuery, selectedMuscle, t, exercisesDb]);

  const uniqueMuscles = useMemo(
    () => [...new Set(exercisesDb.map((ex) => ex.muscleGroup))],
    [exercisesDb],
  );

  const renderDraggableExercise = useCallback(
    ({ item: exercise, drag, isActive }: RenderItemParams<RoutineExercise>) => {
      const unitText = exercise.sets[0]
        ? t(`activeWorkout.units.${exercise.sets[0].weightUnit}`)
        : "KG";
      return (
        <ExerciseListItem
          exercise={exercise}
          drag={drag}
          isActive={isActive}
          colors={colors}
          styles={styles}
          t={t}
          isReadonly={isReadonly}
          unitText={unitText}
          onDetails={setDetailsExercise}
          onRemoveEx={removeExerciseFromActiveRoutine}
          onOpenRest={openRestEditor}
          onUnitModal={setUnitModalExId}
          onRemoveSet={removeSetFromExercise}
          getPrevSet={getPreviousSet}
          onSetChange={handleSetChange}
          onToggleCompletion={toggleSetCompletion}
          onAddSet={addSetToExercise}
        />
      );
    },
    [
      colors,
      styles,
      t,
      isReadonly,
      removeExerciseFromActiveRoutine,
      openRestEditor,
      removeSetFromExercise,
      getPreviousSet,
      handleSetChange,
      toggleSetCompletion,
      addSetToExercise,
    ],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/*Header*/}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleMinimize}>
          <AntDesign
            name="down"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={handleFinishWorkout}
        >
          <Text style={styles.finishBtnText}>
            {t("activeWorkout.finish", "Finish")}
          </Text>
        </TouchableOpacity>
      </View>

      {/*Estadísticas*/}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            {t("activeWorkout.duration", "Duration")}
          </Text>
          <Text style={[styles.statValue, styles.statValuePrimary]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            {t("activeWorkout.totalVolume", "Volume")}
          </Text>
          <Text style={styles.statValue}>
            {stats.volume.toLocaleString()} {volumeUnitText}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            {t("activeWorkout.completedSets", "Sets")}
          </Text>
          <Text style={styles.statValue}>{stats.sets}</Text>
        </View>
      </View>

      {/*Lista de ejercicios*/}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? verticalScale(110) : 0}
      >
        <DraggableFlatList
          keyboardDismissMode="interactive"
          data={activeRoutine.exercises}
          onDragEnd={({ data }) => reorderActiveExercises(data)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: moderateScale(15),
            paddingBottom: isResting
              ? verticalScale(100) + insets.bottom
              : verticalScale(20) + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={renderDraggableExercise}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <View>
              {!isReadonly && (
                <TouchableOpacity
                  style={styles.addExerciseBtn}
                  onPress={openExerciseSelector}
                >
                  <Feather
                    name="plus"
                    size={moderateScale(20)}
                    color={colors.primary}
                    style={styles.addExerciseBtnIcon}
                  />
                  <Text style={styles.addExerciseBtnText}>
                    {t("routines.addExercise", "Añadir Ejercicio")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelWorkoutButton}
                onPress={handleCancelWorkout}
              >
                <Text style={styles.cancelWorkoutText}>
                  {t("activeWorkout.cancelWorkoutButton")}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/*Banner de descanso*/}
      {isResting && restTimeRemaining !== null && (
        <View
          style={[
            styles.floatingRestBanner,
            {
              paddingBottom: Math.max(
                verticalScale(50),
                insets.bottom + verticalScale(20),
              ),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingRestAdjustBtn}
            onPress={() => adjustRestTime(-15)}
          >
            <Text style={styles.floatingRestAdjustText}>-15</Text>
          </TouchableOpacity>
          <Text style={styles.floatingRestTime}>
            {formatRestTimeStr(restTimeRemaining)}
          </Text>
          <TouchableOpacity
            style={styles.floatingRestAdjustBtn}
            onPress={() => adjustRestTime(15)}
          >
            <Text style={styles.floatingRestAdjustText}>+15</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingRestSkipBtn}
            onPress={stopRestTimer}
          >
            <Text style={styles.floatingRestSkipText}>
              {t("activeWorkout.skip")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/*Modal de selección de unidades*/}
      <Modal
        visible={!!unitModalExId}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUnitModalExId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editRestModalContent}>
            <Text style={styles.editRestTitle}>
              {t("unitSelection.title", "Seleccionar Unidad")}
            </Text>

            <TouchableOpacity
              style={styles.unitOptionBtn}
              onPress={() => handleUnitSelect("kg")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.kg", "Kilogramos (kg)")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.kg_desc")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unitOptionBtn}
              onPress={() => handleUnitSelect("lbs")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.lbs", "Libras (lbs)")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.lbs_desc")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unitOptionBtn}
              onPress={() => handleUnitSelect("bodyweight")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.bodyweight", "Peso Corporal")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.bodyweight_desc")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unitOptionBtn}
              onPress={() => handleUnitSelect("bars")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.bars", "Barras / Bloques")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.bars_desc")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.unitOptionBtn, styles.unitOptionBtnLast]}
              onPress={() => handleUnitSelect("plates")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.plates", "Discos")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.plates_desc")}
              </Text>
            </TouchableOpacity>

            <View style={[styles.editRestButtonsRow, styles.unitOptionsMargin]}>
              <TouchableOpacity
                style={[styles.editRestBtn, styles.editRestBtnTransparent]}
                onPress={() => setUnitModalExId(null)}
              >
                <Text
                  style={[
                    styles.editRestBtnText,
                    styles.editRestBtnTextSecondary,
                  ]}
                >
                  {t("common.cancel", "Cancelar")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Modal de edición de tiempo de descanso*/}
      <Modal
        visible={!!restEditExId}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRestEditExId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editRestModalContent}>
            <Text style={styles.editRestTitle}>
              {t("activeWorkout.restTimer", "Tiempo de Descanso")}
            </Text>
            <View style={styles.editRestControls}>
              <TouchableOpacity
                style={styles.floatingRestAdjustBtn}
                onPress={() => setTempRest((prev) => Math.max(0, prev - 15))}
              >
                <Text style={styles.floatingRestAdjustText}>-15</Text>
              </TouchableOpacity>
              <Text style={styles.editRestTimeDisplay}>
                {formatRestTimeStr(tempRest)}
              </Text>
              <TouchableOpacity
                style={styles.floatingRestAdjustBtn}
                onPress={() => setTempRest((prev) => prev + 15)}
              >
                <Text style={styles.floatingRestAdjustText}>+15</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editRestButtonsRow}>
              <TouchableOpacity
                style={[styles.editRestBtn, styles.editRestBtnTransparent]}
                onPress={() => setRestEditExId(null)}
              >
                <Text
                  style={[
                    styles.editRestBtnText,
                    styles.editRestBtnTextSecondary,
                  ]}
                >
                  {t("common.cancel", "Cancelar")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editRestBtn, styles.editRestBtnPrimary]}
                onPress={saveRestTime}
              >
                <Text style={styles.editRestBtnText}>
                  {t("routines.save", "Guardar")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Resumen de entrenamiento y selección de ejercicios*/}
      <WorkoutSummaryModal
        visible={showSummary}
        insets={insets}
        styles={styles}
        t={t}
        elapsedSeconds={elapsedSeconds}
        stats={stats}
        volumeUnitText={volumeUnitText}
        formatTime={formatTime}
        muscleDistribution={muscleDistribution}
        handleCloseSummary={handleCloseSummary}
        isSavingHistory={isSavingHistory}
      />

      <ExerciseDetailsModal
        visible={!!detailsExercise}
        onClose={() => setDetailsExercise(null)}
        exercise={detailsExercise}
      />

      <ExerciseSelectorModal
        visible={exerciseModalVisible}
        onClose={() => setExerciseModalVisible(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedMuscle={selectedMuscle}
        setSelectedMuscle={setSelectedMuscle}
        uniqueMuscles={uniqueMuscles}
        filteredExercises={filteredExercises}
        tempSelectedExercises={tempSelectedExercises}
        toggleExerciseSelection={toggleExerciseSelection}
        onConfirm={confirmSelectedExercises}
      />
    </SafeAreaView>
  );
}

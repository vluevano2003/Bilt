import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

import { useActiveWorkoutScreen } from "../hooks/useActiveWorkout";
import { RoutineExercise } from "../hooks/useRoutines";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/ActiveWorkout.styles";

export default function ActiveWorkoutScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    t,
    router,
    activeRoutine,
    elapsedSeconds,
    restTimeRemaining,
    isResting,
    showSummary,
    stats,
    handleSetChange,
    measurementSystem,
    addSetToExercise,
    removeSetFromExercise,
    toggleSetCompletion,
    adjustRestTime,
    stopRestTimer,
    reorderActiveExercises,
    formatTime,
    formatRestTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    updateExerciseRestTime,
    changeExerciseUnit,
  } = useActiveWorkoutScreen();

  const [restEditExId, setRestEditExId] = useState<string | null>(null);
  const [tempRest, setTempRest] = useState(90);
  const [unitModalExId, setUnitModalExId] = useState<string | null>(null);

  const volumeUnitText = measurementSystem === "metric" ? "kg" : "lbs";

  if (!activeRoutine) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>
          No hay rutina activa
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReadonly = !!activeRoutine.originalCreatorId;

  const openRestEditor = (exId: string, currentRest: number) => {
    setRestEditExId(exId);
    setTempRest(currentRest);
  };

  const saveRestTime = () => {
    if (restEditExId) {
      updateExerciseRestTime(restEditExId, tempRest);
    }
    setRestEditExId(null);
  };

  const handleUnitSelect = (unit: any) => {
    if (unitModalExId) {
      changeExerciseUnit(unitModalExId, unit);
    }
    setUnitModalExId(null);
  };

  const renderDraggableExercise = ({
    item: exercise,
    drag,
    isActive,
  }: RenderItemParams<RoutineExercise>) => {
    const unitText = exercise.sets[0]
      ? t(`activeWorkout.units.${exercise.sets[0].weightUnit}`)
      : "KG";

    return (
      <ScaleDecorator>
        <View
          style={[styles.exerciseCard, isActive && styles.exerciseCardActive]}
        >
          {/*Header Draggable*/}
          <TouchableOpacity
            style={styles.exerciseHeader}
            onLongPress={!isReadonly ? drag : undefined}
            delayLongPress={200}
            activeOpacity={isReadonly ? 1 : 0.7}
          >
            <Text style={styles.exerciseName}>
              {t(`exercises.${exercise.exerciseDetails.id}`)}
            </Text>
          </TouchableOpacity>

          {/*Temporizador de descanso por ejercicio*/}
          <TouchableOpacity
            style={styles.exerciseRestIndicator}
            onPress={() =>
              openRestEditor(exercise.id, exercise.restTimeSeconds || 90)
            }
          >
            <Feather name="clock" size={14} color={colors.primary} />
            <Text style={styles.exerciseRestText}>
              Rest Timer: {formatRestTime(exercise.restTimeSeconds || 90)}
            </Text>
          </TouchableOpacity>

          {/* Cabecera de la Tabla */}
          <View style={styles.tableHeader}>
            <Text style={styles.colSetHeader}>
              {t("activeWorkout.set", "SET")}
            </Text>
            <Text style={styles.colPrevHeader}>ANTERIOR</Text>

            <TouchableOpacity
              style={styles.colInputHeader}
              onPress={() => setUnitModalExId(exercise.id)}
            >
              <Text style={styles.tableHeaderText}>{unitText}</Text>
            </TouchableOpacity>

            <View style={styles.colInputHeader}>
              <Text style={styles.tableHeaderText}>
                {t("activeWorkout.reps", "REPS")}
              </Text>
            </View>
            <View style={styles.colCheckHeader}>
              <Feather name="check" size={14} color={colors.textSecondary} />
            </View>
          </View>

          {/*Filas de series*/}
          {exercise.sets.map((set, setIndex) => (
            <View
              key={set.id}
              style={[styles.setRow, set.completed && styles.setRowCompleted]}
            >
              {/*Número de serie*/}
              <View style={styles.colSet}>
                {!set.completed && !isReadonly && (
                  <TouchableOpacity
                    onPress={() => removeSetFromExercise(exercise.id, set.id)}
                    style={styles.deleteSetIcon}
                  >
                    <Feather name="minus-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <Text style={styles.setText}>{setIndex + 1}</Text>
              </View>

              {/*Anterior*/}
              <View style={styles.colPrev}>
                <Text style={styles.prevText}>-</Text>
              </View>

              {/*Peso*/}
              <View style={styles.colInput}>
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  keyboardType="numeric"
                  value={set.weight ? set.weight.toString() : ""}
                  placeholder="-"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(val) =>
                    handleSetChange(exercise.id, set.id, "weight", val)
                  }
                  editable={!set.completed}
                  selectTextOnFocus
                />
              </View>

              {/*Repeticiones*/}
              <View style={styles.colInput}>
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  keyboardType="numeric"
                  value={set.reps ? set.reps.toString() : ""}
                  placeholder="-"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(val) =>
                    handleSetChange(exercise.id, set.id, "reps", val)
                  }
                  editable={!set.completed}
                  selectTextOnFocus
                />
              </View>

              {/*Botón de completado*/}
              <View style={styles.colCheck}>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    set.completed
                      ? styles.checkButtonActive
                      : styles.checkButtonInactive,
                  ]}
                  onPress={() =>
                    toggleSetCompletion(
                      exercise.id,
                      set.id,
                      exercise.restTimeSeconds || 90,
                    )
                  }
                >
                  <Feather
                    name="check"
                    size={16}
                    color={set.completed ? "#FFF" : "transparent"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/*Botón añadir serie*/}
          {!isReadonly && (
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => addSetToExercise(exercise.id)}
            >
              <Feather
                name="plus"
                size={16}
                color={colors.textPrimary}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.addSetText}>
                {t("activeWorkout.addSet", "Add Set")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleMinimize}>
          <AntDesign name="down" size={20} color={colors.textPrimary} />
          <Text style={styles.headerTitle}>
            {t("activeWorkout.logWorkout")}
          </Text>
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

      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>
            {t("activeWorkout.duration", "Duration")}
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DraggableFlatList
          data={activeRoutine.exercises}
          onDragEnd={({ data }) => reorderActiveExercises(data)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 15,
            paddingBottom: isResting ? 120 : 100,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={renderDraggableExercise}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <TouchableOpacity
              style={styles.cancelWorkoutButton}
              onPress={handleCancelWorkout}
            >
              <Text style={styles.cancelWorkoutText}>
                {t("activeWorkout.cancelWorkoutButton")}
              </Text>
            </TouchableOpacity>
          }
        />
      </KeyboardAvoidingView>

      {/*Barra de descanso flotante*/}
      {isResting && restTimeRemaining !== null && (
        <View style={styles.floatingRestBanner}>
          <TouchableOpacity
            style={styles.floatingRestAdjustBtn}
            onPress={() => adjustRestTime(-15)}
          >
            <Text style={styles.floatingRestAdjustText}>-15</Text>
          </TouchableOpacity>

          <Text style={styles.floatingRestTime}>
            {formatRestTime(restTimeRemaining)}
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

      {/* Modal para cambiar unidades de medida */}
      <Modal visible={!!unitModalExId} animationType="fade" transparent={true}>
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
              style={[styles.unitOptionBtn, { borderBottomWidth: 0 }]}
              onPress={() => handleUnitSelect("plates")}
            >
              <Text style={styles.unitOptionTitle}>
                {t("unitSelection.plates", "Discos")}
              </Text>
              <Text style={styles.unitOptionDesc}>
                {t("unitSelection.plates_desc")}
              </Text>
            </TouchableOpacity>

            <View style={[styles.editRestButtonsRow, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.editRestBtn, { backgroundColor: "transparent" }]}
                onPress={() => setUnitModalExId(null)}
              >
                <Text
                  style={[
                    styles.editRestBtnText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t("common.cancel", "Cancelar")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Modal para editar tiempo de descanso*/}
      <Modal visible={!!restEditExId} animationType="fade" transparent={true}>
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
                {formatRestTime(tempRest)}
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
                style={[styles.editRestBtn, { backgroundColor: "transparent" }]}
                onPress={() => setRestEditExId(null)}
              >
                <Text
                  style={[
                    styles.editRestBtnText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t("common.cancel", "Cancelar")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.editRestBtn,
                  { backgroundColor: colors.primary, borderWidth: 0 },
                ]}
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

      {/*Resumen*/}
      <Modal visible={showSummary} animationType="slide" transparent={true}>
        <View style={styles.summaryOverlay}>
          <View style={styles.summaryContent}>
            <Feather
              name="award"
              size={50}
              color={colors.primary}
              style={{ alignSelf: "center", marginBottom: 15 }}
            />
            <Text style={styles.summaryTitle}>
              {t("activeWorkout.summaryTitle")}
            </Text>

            <View style={styles.summaryRow}>
              <Feather name="clock" size={20} color={colors.textSecondary} />
              <Text style={styles.summaryLabel}>
                {t("activeWorkout.duration")}
              </Text>
              <Text style={styles.summaryValue}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Feather name="activity" size={20} color={colors.textSecondary} />
              <Text style={styles.summaryLabel}>
                {t("activeWorkout.totalVolume")}
              </Text>
              <Text style={styles.summaryValue}>
                {stats.volume.toLocaleString()} {volumeUnitText}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Feather
                name="check-circle"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.summaryLabel}>
                {t("activeWorkout.completedSets")}
              </Text>
              <Text style={styles.summaryValue}>{stats.sets}</Text>
            </View>

            <TouchableOpacity
              style={styles.summaryCloseButton}
              onPress={handleCloseSummary}
            >
              <Text style={styles.summaryCloseText}>
                {t("activeWorkout.closeSummary")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

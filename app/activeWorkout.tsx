import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveWorkoutScreen } from "../hooks/useActiveWorkout";
import { ExerciseType, RoutineExercise } from "../hooks/useRoutines";
import { ExerciseDetailsModal } from "../src/components/RoutinesModals";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { getStyles } from "../src/styles/ActiveWorkout.styles";

export default function ActiveWorkoutScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

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
    formatRestTime,
    handleMinimize,
    handleFinishWorkout,
    handleCloseSummary,
    handleCancelWorkout,
    updateExerciseRestTime,
    changeExerciseUnit,
    getPreviousSet,
    isSavingHistory,
  } = useActiveWorkoutScreen();

  const [restEditExId, setRestEditExId] = useState<string | null>(null);
  const [tempRest, setTempRest] = useState(90);
  const [unitModalExId, setUnitModalExId] = useState<string | null>(null);
  const [detailsExercise, setDetailsExercise] = useState<ExerciseType | null>(
    null,
  );

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
    if (restEditExId) updateExerciseRestTime(restEditExId, tempRest);
    setRestEditExId(null);
  };

  const handleUnitSelect = (unit: any) => {
    if (unitModalExId) changeExerciseUnit(unitModalExId, unit);
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
          <TouchableOpacity
            style={styles.exerciseHeader}
            onLongPress={!isReadonly ? drag : undefined}
            onPress={() => setDetailsExercise(exercise.exerciseDetails)}
            delayLongPress={200}
            activeOpacity={0.7}
          >
            <Text style={styles.exerciseName}>
              {t(`exercises.${exercise.exerciseDetails.id}`)}{" "}
              <Feather name="info" size={16} color={colors.textSecondary} />
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exerciseRestIndicator}
            onPress={() =>
              openRestEditor(exercise.id, exercise.restTimeSeconds || 90)
            }
          >
            <Feather name="clock" size={14} color={colors.primary} />
            <Text style={styles.exerciseRestText}>
              {t("activeWorkout.restTimer", "Rest Timer")}:{" "}
              {formatRestTime(exercise.restTimeSeconds || 90)}
            </Text>
          </TouchableOpacity>

          <View style={styles.tableHeader}>
            <Text style={styles.colSetHeader}>
              {t("activeWorkout.set", "SET")}
            </Text>
            <Text style={styles.colPrevHeader}>
              {t("activeWorkout.previous", "ANTERIOR").toUpperCase()}
            </Text>

            {/* ESTE ES EL BOTÓN QUE ABRE EL MODAL DE UNIDADES */}
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

          {exercise.sets.map((set, setIndex) => (
            <View
              key={set.id}
              style={[styles.setRow, set.completed && styles.setRowCompleted]}
            >
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
              <View style={styles.colPrev}>
                <Text style={styles.prevText}>
                  {getPreviousSet(exercise.exerciseDetails.id, setIndex)}
                </Text>
              </View>
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
                {t("activeWorkout.addSet", "Añadir Serie")}
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
            paddingBottom: isResting
              ? 120 + insets.bottom
              : 100 + insets.bottom,
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

      {isResting && restTimeRemaining !== null && (
        <View
          style={[
            styles.floatingRestBanner,
            { paddingBottom: Math.max(50, insets.bottom + 20) },
          ]}
        >
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

      {/*MODAL PARA CAMBIAR UNIDADES*/}
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

      {/*MODAL DE DESCANSO*/}
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

      {/*MODAL DE RESUMEN*/}
      <Modal visible={showSummary} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}
          >
            <View
              style={{ alignItems: "center", marginTop: 40, marginBottom: 30 }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 32,
                  fontWeight: "900",
                }}
              >
                {t("activeWorkout.goodJob", "¡Buen trabajo!")}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                  marginTop: 5,
                }}
              >
                {t(
                  "activeWorkout.workoutCompleted",
                  "Entrenamiento completado",
                )}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                marginHorizontal: 20,
                borderRadius: 24,
                padding: 25,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 30,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingBottom: 25,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {t("activeWorkout.duration", "Duración")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    {formatTime(elapsedSeconds)}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {t("activeWorkout.totalVolume", "Volumen")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    {stats.volume.toLocaleString()}{" "}
                    <Text style={{ fontSize: 14 }}>{volumeUnitText}</Text>
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {t("activeWorkout.completedSets", "Series")}
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    {stats.sets}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 15,
                }}
              >
                {t("activeWorkout.musclesWorked", "Músculos trabajados")}
              </Text>
              {muscleDistribution.length > 0 ? (
                muscleDistribution.map((muscle) => (
                  <View key={muscle.name} style={{ marginBottom: 15 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                        {t(`muscles.${muscle.name}`)}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        {Math.round(muscle.percentage)}%
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        backgroundColor: colors.background,
                        borderRadius: 4,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${muscle.percentage}%`,
                          backgroundColor: colors.primary,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    fontStyle: "italic",
                    marginTop: 10,
                  }}
                >
                  {t(
                    "activeWorkout.noSetsValid",
                    "No completaste ninguna serie válida.",
                  )}
                </Text>
              )}
            </View>
          </ScrollView>

          <View
            style={{
              position: "absolute",
              bottom: Math.max(35, insets.bottom + 15),
              left: 20,
              right: 20,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <BannerAd
                unitId={TestIds.BANNER}
                size={BannerAdSize.BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
              onPress={handleCloseSummary}
              disabled={isSavingHistory}
            >
              {isSavingHistory && (
                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
              )}
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
                {isSavingHistory
                  ? "Guardando..."
                  : t("common.finish", "Terminar")}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <ExerciseDetailsModal
        visible={!!detailsExercise}
        onClose={() => setDetailsExercise(null)}
        exercise={detailsExercise}
      />
    </SafeAreaView>
  );
}

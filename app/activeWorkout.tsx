import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
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

import { useActiveWorkoutScreen } from "../hooks/useActiveWorkoutScreen";
import { RoutineExercise } from "../hooks/useRoutines";
import { colors } from "../src/constants/theme";
import { styles } from "../src/styles/ActiveWorkoutScreen.styles";

export default function ActiveWorkoutScreen() {
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
    toggleUnit,
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
  } = useActiveWorkoutScreen();

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

  /**
   * Renderiza cada ejercicio como un elemento draggable, mostrando sus sets y permitiendo editar peso, reps, marcar como completado, etc.
   * @param param0
   * @returns
   */
  const renderDraggableExercise = ({
    item: exercise,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<RoutineExercise>) => {
    const index = getIndex() || 0;
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.exerciseCard,
            isActive && {
              backgroundColor: colors.background,
              borderColor: colors.primary,
              elevation: 10,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 15,
            }}
          >
            <Text style={[styles.exerciseName, { flex: 1, marginBottom: 0 }]}>
              {index + 1}. {t(`exercises.${exercise.exerciseDetails.id}`)}
            </Text>
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              style={{ padding: 5 }}
            >
              <Feather name="menu" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>
              {t("activeWorkout.set")}
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1.2, textAlign: "center" },
              ]}
            >
              {t("activeWorkout.weight")}
            </Text>
            <Text
              style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}
            >
              {t("activeWorkout.reps")}
            </Text>
            <View style={{ flex: 0.5 }} />
          </View>

          {exercise.sets.map((set, setIndex) => (
            <View
              key={set.id}
              style={[styles.setRow, set.completed && styles.setRowCompleted]}
            >
              <View
                style={{
                  flex: 0.5,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {!set.completed && (
                  <TouchableOpacity
                    onPress={() => removeSetFromExercise(exercise.id, set.id)}
                    style={{ marginRight: 6 }}
                  >
                    <Feather name="minus-circle" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <Text style={styles.setText}>{setIndex + 1}</Text>
              </View>

              <View
                style={{
                  flex: 1.2,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  keyboardType="numeric"
                  value={set.weight ? set.weight.toString() : ""}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(val) =>
                    handleSetChange(exercise.id, set.id, "weight", val)
                  }
                  editable={!set.completed}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={[styles.unitBadge, set.completed && { opacity: 0.5 }]}
                  onPress={() => toggleUnit(exercise.id, set.id)}
                  disabled={set.completed}
                >
                  <Text style={styles.unitText}>
                    {t(`activeWorkout.units.${set.weightUnit}`)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, alignItems: "center" }}>
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  keyboardType="numeric"
                  value={set.reps ? set.reps.toString() : ""}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(val) =>
                    handleSetChange(exercise.id, set.id, "reps", val)
                  }
                  editable={!set.completed}
                  selectTextOnFocus
                />
              </View>

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
                  color={set.completed ? "#FFF" : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => addSetToExercise(exercise.id)}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={styles.addSetText}>{t("activeWorkout.addSet")}</Text>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleMinimize}>
          <AntDesign name="down" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <TouchableOpacity onPress={handleFinishWorkout}>
          <Text style={styles.finishText}>{t("activeWorkout.finish")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.routineTitle}>
        {t("activeWorkout.workoutOf", { name: activeRoutine.name })}
      </Text>

      {/*Banner de tiempo de descanso, mostrando el tiempo restante y controles para ajustar o saltar el descanso*/}
      {isResting && restTimeRemaining !== null && (
        <View style={styles.restBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restBannerTitle}>
              {t("activeWorkout.restTimer", "Tiempo de Descanso")}
            </Text>
            <Text style={styles.restBannerTime}>
              {formatRestTime(restTimeRemaining)}
            </Text>
          </View>
          <View style={styles.restControls}>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => adjustRestTime(-15)}
            >
              <Text style={styles.restAdjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => adjustRestTime(15)}
            >
              <Text style={styles.restAdjustText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restSkipBtn}
              onPress={stopRestTimer}
            >
              <Text style={styles.restSkipText}>
                {t("activeWorkout.skip", "Saltar")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/*Lista de ejercicios, cada uno con sus sets, permitiendo arrastrar para reordenar, editar peso/reps, marcar sets como completados, etc.*/}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DraggableFlatList
          data={activeRoutine.exercises}
          onDragEnd={({ data }) => reorderActiveExercises(data)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderDraggableExercise}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <TouchableOpacity
              style={styles.cancelWorkoutButton}
              onPress={handleCancelWorkout}
            >
              <Feather
                name="trash-2"
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cancelWorkoutText}>
                {t("activeWorkout.cancelWorkoutButton")}
              </Text>
            </TouchableOpacity>
          }
        />
      </KeyboardAvoidingView>

      {/*Modal de resumen al finalizar el workout, mostrando duración, volumen total, sets completados, etc.*/}
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
                {stats.volume.toLocaleString()} kg
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

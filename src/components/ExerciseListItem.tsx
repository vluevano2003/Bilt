import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View, LayoutAnimation } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { Swipeable, TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

const cycleSetType = (currentType: string) => {
  switch (currentType) {
    case "normal": return "warmup";
    case "warmup": return "dropset";
    case "dropset": return "topset";
    case "topset": return "backoff";
    case "backoff": return "normal";
    default: return "normal";
  }
};

const getSetTypeLabel = (type: string, index: number, sets?: any[]) => {
  if (type && type !== "normal") {
    switch (type) {
      case "warmup": return "W";
      case "dropset": return "D";
      case "topset": return "T";
      case "backoff": return "B";
    }
  }

  if (!sets) return (index + 1).toString();

  let normalCount = 0;
  for (let i = 0; i <= index; i++) {
    const sType = sets[i]?.type;
    if (!sType || sType === "normal") {
      normalCount++;
    }
  }
  return normalCount.toString();
};

const getSetTypeColor = (type: string, defaultColor: string, colors: any) => {
  switch (type) {
    case "warmup": return "#F59E0B"; // Amber
    case "dropset": return "#3B82F6"; // Blue
    case "topset": return "#EF4444"; // Red
    case "backoff": return "#10B981"; // Green
    case "normal":
    default:
      return defaultColor;
  }
};

const getSetTypeBackground = (type: string | undefined) => {
  switch (type) {
    case "warmup": return "rgba(245, 158, 11, 0.05)"; // Amber
    case "dropset": return "rgba(59, 130, 246, 0.05)"; // Blue
    case "topset": return "rgba(239, 68, 68, 0.05)"; // Red
    case "backoff": return "rgba(16, 185, 129, 0.05)"; // Green
    case "normal":
    default:
      return undefined;
  }
};

/**
 * Componente que representa un ejercicio dentro de la lista de ejercicios activos, mostrando su nombre, sets, pesos, repeticiones y permitiendo marcar sets como completados, editar valores y acceder a detalles o temporizador de descanso.
 */
export const ExerciseListItem = React.memo(
  ({
    exercise,
    drag,
    isActive,
    styles,
    colors,
    t,
    isReadonly,
    unitText,
    measurementSystem,
    onDetails,
    onOpenHistory,
    onRemoveEx,
    onOpenRest,
    onUnitModal,
    onRemoveSet,
    getPrevSet,
    onSetChange,
    onOpenSetTypeModal,
    onToggleCompletion,
    onAddSet,
  }: any) => {
    const [swipingSets, setSwipingSets] = React.useState<Record<string, boolean>>({});
    const isCardio = exercise.exerciseDetails.muscleGroup === "cardio";

    const hasBodyweightSet = exercise.sets.some(
      (s: any) => s.weightUnit === "bodyweight",
    );

    const hasCompletedSets = exercise.sets.some((s: any) => s.completed);

    const handleAddSet = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onAddSet(exercise.id);
    };

    const handleRemoveSet = (setId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRemoveSet(exercise.id, setId);
    };

    const handleRemoveEx = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (onRemoveEx) onRemoveEx(exercise.id);
    };

    return (
      <ScaleDecorator>
        <View
          style={[styles.exerciseCard, isActive && styles.exerciseCardActive]}
        >
          <View style={styles.exerciseHeaderRow}>
            <TouchableOpacity
              style={[
                styles.exerciseHeader,
                { flex: 1, flexDirection: "column", alignItems: "flex-start" },
              ]}
              onPress={() => onDetails(exercise.exerciseDetails)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseName}>
                {t(`exercises.${exercise.exerciseDetails.id}`)}{" "}
                <Feather
                  name="info"
                  size={scale(16)}
                  color={colors.textSecondary}
                />
              </Text>
            </TouchableOpacity>

            {!isReadonly && (
              <TouchableOpacity
                onPressIn={drag}
                style={{
                  paddingVertical: verticalScale(4),
                  paddingLeft: scale(12),
                }}
              >
                <Feather
                  name="menu"
                  size={scale(24)}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.exerciseRestIndicator}
            onPress={() =>
              onOpenRest(exercise.id, exercise.restTimeSeconds || 90)
            }
          >
            <Feather name="clock" size={scale(14)} color={colors.primary} />
            <Text style={styles.exerciseRestText}>
              {t("activeWorkout.restTimer")}:{" "}
              {Math.floor((exercise.restTimeSeconds || 90) / 60)}:
              {((exercise.restTimeSeconds || 90) % 60)
                .toString()
                .padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          {hasBodyweightSet && (
            <View
              style={{
                paddingHorizontal: scale(15),
                marginBottom: verticalScale(5),
              }}
            >
              <Text
                style={{
                  fontSize: moderateScale(11),
                  color: colors.textSecondary,
                  fontStyle: "italic",
                }}
              >
                {t("unitSelection.bodyweight_desc")}
              </Text>
            </View>
          )}

          <View style={styles.tableHeader}>
            <Text style={styles.colSetHeader}>{t("activeWorkout.set").toUpperCase()}</Text>

            <View style={[styles.colPrevHeader, { alignItems: 'center', justifyContent: 'center' }]}>
              <TouchableOpacity 
                style={[styles.unitButton, { paddingHorizontal: scale(5) }]}
                onPress={() => onOpenHistory && onOpenHistory(exercise.exerciseDetails)}
              >
                <Text style={[styles.unitButtonText, { fontSize: moderateScale(9) }]} numberOfLines={1} adjustsFontSizeToFit>
                  {t("activeWorkout.previous").toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colInputHeader}>
              <TouchableOpacity
                style={[styles.unitButton, hasCompletedSets && { opacity: 0.5 }]}
                onPress={() => {
                  if (!hasCompletedSets) {
                    onUnitModal(exercise.id);
                  }
                }}
                disabled={hasCompletedSets}
              >
                <Text style={styles.unitButtonText}>{unitText}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.colInputHeader}>
              <Text style={styles.tableHeaderText}>
                {isCardio
                  ? t("activeWorkout.timeMin")
                  : t("activeWorkout.reps")}
              </Text>
            </View>
            <View style={styles.colCheckHeader}>
              <Feather
                name="check"
                size={scale(14)}
                color={colors.textSecondary}
              />
            </View>
          </View>

          {exercise.sets.map((set: any, setIndex: number) => {
            const prevData = getPrevSet(exercise.exerciseDetails.id, setIndex);

            const renderLeftActions = () => {
              if (isReadonly || set.completed) return null;
              return (
                <GHTouchableOpacity
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: scale(50),
                    height: "100%",
                  }}
                  onPress={() => handleRemoveSet(set.id)}
                >
                  <Feather name="trash-2" size={scale(24)} color="#EF4444" />
                </GHTouchableOpacity>
              );
            };

            return (
              <View key={set.id} style={{ marginBottom: verticalScale(5) }}>
                <Swipeable 
                  renderLeftActions={renderLeftActions} 
                  overshootLeft={false}
                  onSwipeableWillOpen={() => setSwipingSets(prev => ({ ...prev, [set.id]: true }))}
                  onSwipeableWillClose={() => setSwipingSets(prev => ({ ...prev, [set.id]: false }))}
                >
                  <View
                    style={[
                      styles.setRow, 
                      { 
                        marginBottom: 0, 
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: set.completed ? "transparent" : colors.border,
                        borderLeftWidth: (!isReadonly && !set.completed) ? scale(4) : 1,
                        borderLeftColor: (!isReadonly && !set.completed) ? "rgba(239, 68, 68, 0.4)" : (set.completed ? "transparent" : colors.border),
                        backgroundColor: getSetTypeBackground(set.type)
                      },
                      set.completed && styles.setRowCompleted,
                      swipingSets[set.id] && { backgroundColor: "rgba(239, 68, 68, 0.15)" }
                    ]}
                  >
                    <View style={styles.colSet}>
                    <GHTouchableOpacity
                      onPress={() => {
                        if (!isReadonly && onOpenSetTypeModal) {
                          onOpenSetTypeModal(exercise.id, set.id, set.type || "normal");
                        }
                      }}
                      style={{
                        backgroundColor: (set.type && set.type !== "normal") ? getSetTypeColor(set.type, colors.surface, colors) : "rgba(0,0,0,0.05)",
                        width: scale(28),
                        height: scale(28),
                        borderRadius: scale(14),
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: (set.type && set.type !== "normal") ? 0 : 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={[styles.setText, { color: (set.type && set.type !== "normal") ? "#FFF" : colors.textPrimary }]}>
                        {getSetTypeLabel(set.type, setIndex, exercise.sets)}
                      </Text>
                    </GHTouchableOpacity>
                  </View>

                <View style={styles.colPrev}>
                  <Text style={styles.prevText}>{prevData || "-"}</Text>
                </View>

                {/* Si es cardio, weight funge como "distancia" */}
                <View style={styles.colInput}>
                  <TextInput
                    style={[
                      styles.input,
                      set.completed && styles.inputDisabled,
                    ]}
                    keyboardType="numeric"
                    value={set.weight ? set.weight.toString() : ""}
                    placeholder=""
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(val) =>
                      onSetChange(exercise.id, set.id, "weight", val)
                    }
                    editable={!set.completed}
                  />
                  {/* Indicador dinámico de unidad para lastre */}
                  {set.weightUnit === "bodyweight" && (
                    <Text
                      style={{
                        position: "absolute",
                        right: scale(8),
                        fontSize: moderateScale(9),
                        color: colors.textSecondary,
                      }}
                    >
                      {measurementSystem === "metric" ? "kg" : "lbs"}
                    </Text>
                  )}
                </View>

                {/* Si es cardio, reps funge como "tiempo en segundos" */}
                <View style={styles.colInput}>
                  <TextInput
                    style={[
                      styles.input,
                      set.completed && styles.inputDisabled,
                    ]}
                    keyboardType="numeric"
                    value={set.reps ? set.reps.toString() : ""}
                    placeholder=""
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(val) =>
                      onSetChange(exercise.id, set.id, "reps", val)
                    }
                    editable={!set.completed}
                    selectTextOnFocus={false}
                    underlineColorAndroid="transparent"
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
                      onToggleCompletion(
                        exercise.id,
                        set.id,
                        exercise.restTimeSeconds || 90,
                      )
                    }
                  >
                    <Feather
                      name="check"
                      size={scale(16)}
                      color={set.completed ? "#FFF" : "transparent"}
                    />
                  </TouchableOpacity>
                </View>
                  </View>
                </Swipeable>
              </View>
            );
          })}

          {!isReadonly && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: verticalScale(10),
              }}
            >
              <TouchableOpacity
                style={[
                  styles.addSetButton,
                  { flex: 1, marginTop: 0, marginRight: scale(10) },
                ]}
                onPress={handleAddSet}
              >
                <Feather
                  name="plus"
                  size={scale(16)}
                  color={colors.textPrimary}
                  style={styles.addSetIcon}
                />
                <Text style={styles.addSetText}>
                  {t("activeWorkout.addSet")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemoveEx}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  paddingHorizontal: scale(15),
                  paddingVertical: verticalScale(10),
                  borderRadius: scale(8),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="trash-2" size={scale(18)} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  },
);

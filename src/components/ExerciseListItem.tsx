import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { scale, verticalScale } from "../utils/Responsive";

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
    onDetails,
    onRemoveEx,
    onOpenRest,
    onUnitModal,
    onRemoveSet,
    getPrevSet,
    onSetChange,
    onToggleCompletion,
    onAddSet,
  }: any) => (
    <ScaleDecorator>
      <View
        style={[styles.exerciseCard, isActive && styles.exerciseCardActive]}
      >
        <View style={styles.exerciseHeaderRow}>
          <TouchableOpacity
            style={[styles.exerciseHeader, { flex: 1 }]}
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
            {t("activeWorkout.restTimer", "Rest Timer")}:{" "}
            {Math.floor((exercise.restTimeSeconds || 90) / 60)}:
            {((exercise.restTimeSeconds || 90) % 60)
              .toString()
              .padStart(2, "0")}
          </Text>
        </TouchableOpacity>

        <View style={styles.tableHeader}>
          <Text style={styles.colSetHeader}>
            {t("activeWorkout.set", "SET")}
          </Text>
          <Text style={styles.colPrevHeader}>
            {t("activeWorkout.previous", "ANTERIOR").toUpperCase()}
          </Text>
          <TouchableOpacity
            style={styles.colInputHeader}
            onPress={() => onUnitModal(exercise.id)}
          >
            <Text style={styles.tableHeaderText}>{unitText}</Text>
          </TouchableOpacity>
          <View style={styles.colInputHeader}>
            <Text style={styles.tableHeaderText}>
              {t("activeWorkout.reps", "REPS")}
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

        {exercise.sets.map((set: any, setIndex: number) => (
          <View
            key={set.id}
            style={[styles.setRow, set.completed && styles.setRowCompleted]}
          >
            <View style={styles.colSet}>
              {!set.completed && !isReadonly && (
                <TouchableOpacity
                  onPress={() => onRemoveSet(exercise.id, set.id)}
                  style={styles.deleteSetIcon}
                >
                  <Feather
                    name="minus-circle"
                    size={scale(20)}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.setText}>{setIndex + 1}</Text>
            </View>
            <View style={styles.colPrev}>
              <Text style={styles.prevText}>
                {getPrevSet(exercise.exerciseDetails.id, setIndex)}
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
                  onSetChange(exercise.id, set.id, "weight", val)
                }
                editable={!set.completed}
                selectTextOnFocus
                underlineColorAndroid="transparent"
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
                  onSetChange(exercise.id, set.id, "reps", val)
                }
                editable={!set.completed}
                selectTextOnFocus
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
        ))}

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
              onPress={() => onAddSet(exercise.id)}
            >
              <Feather
                name="plus"
                size={scale(16)}
                color={colors.textPrimary}
                style={styles.addSetIcon}
              />
              <Text style={styles.addSetText}>
                {t("activeWorkout.addSet", "Añadir Serie")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onRemoveEx(exercise.id)}
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
  ),
);

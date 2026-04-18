import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";
import {
  calculateSessionVolume,
  formatDuration,
  getConvertedWeight,
} from "../utils/workoutCalculations";

/**
 * Modal para mostrar los detalles de un entrenamiento seleccionado en el historial. Muestra duración, volumen total y detalles de cada ejercicio y set.
 * @param param0
 * @returns
 */
export const WorkoutDetailsModal = ({
  visible,
  onClose,
  selectedItem,
  measurementSystem,
  colors,
  styles,
  t,
  insets,
}: any) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              paddingBottom: Math.max(
                verticalScale(40),
                insets.bottom + verticalScale(20),
              ),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedItem?.routineName}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: verticalScale(50) }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: scale(20),
                marginBottom: verticalScale(25),
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(6),
                }}
              >
                <Feather
                  name="clock"
                  size={scale(16)}
                  color={colors.textPrimary}
                />
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: moderateScale(15),
                    fontWeight: "500",
                  }}
                >
                  {formatDuration(selectedItem?.durationSeconds)} min
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(6),
                }}
              >
                <Feather
                  name="activity"
                  size={scale(16)}
                  color={colors.textPrimary}
                />
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: moderateScale(15),
                    fontWeight: "500",
                  }}
                >
                  {calculateSessionVolume(selectedItem, measurementSystem)}{" "}
                  {measurementSystem === "metric" ? "kg" : "lbs"}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.label,
                {
                  marginBottom: verticalScale(15),
                  color: colors.textPrimary,
                  fontSize: moderateScale(16),
                },
              ]}
            >
              {t("routines.exercises")}:
            </Text>

            {selectedItem?.exercises?.map((exercise: any, index: number) => {
              const exerciseName =
                exercise.exerciseDetails?.id
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                "Ejercicio";

              return (
                <View
                  key={index}
                  style={{
                    marginBottom: verticalScale(25),
                    paddingLeft: scale(5),
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: moderateScale(16),
                      fontWeight: "bold",
                      marginBottom: verticalScale(10),
                    }}
                  >
                    • {exerciseName}
                  </Text>
                  {exercise.sets?.map((set: any, setIdx: number) => {
                    let displayUnit = "";
                    let displayWeight = set.weight;

                    if (
                      ["bars", "plates", "bodyweight"].includes(set.weightUnit)
                    ) {
                      displayUnit = t(`unitSelection.${set.weightUnit}`);
                      if (set.weightUnit === "bodyweight" && set.weight === 0) {
                        displayWeight = "";
                      } else if (
                        set.weightUnit === "bodyweight" &&
                        set.weight > 0
                      ) {
                        displayWeight = `+${set.weight}`;
                      }
                    } else {
                      displayWeight = Math.round(
                        getConvertedWeight(
                          set.weight,
                          set.weightUnit,
                          measurementSystem,
                        ),
                      );
                      displayUnit =
                        measurementSystem === "metric" ? "kg" : "lbs";
                    }

                    return (
                      <Text
                        key={setIdx}
                        style={{
                          color: colors.textSecondary,
                          marginLeft: scale(15),
                          fontSize: moderateScale(14),
                          marginBottom: verticalScale(6),
                        }}
                      >
                        Set {setIdx + 1}: {set.reps} reps{" "}
                        {set.weightUnit === "bodyweight" && set.weight === 0
                          ? "BW"
                          : `x ${displayWeight} ${displayUnit}`}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
            { paddingBottom: Math.max(40, insets.bottom + 20) },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItem?.routineName}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
          >
            <View style={styles.detailsStatsContainer}>
              <Text style={styles.detailsStatText}>
                <Feather name="clock" size={16} />{" "}
                {formatDuration(selectedItem?.durationSeconds)} min
              </Text>
              <Text style={styles.detailsStatText}>
                <Feather name="activity" size={16} />{" "}
                {calculateSessionVolume(selectedItem, measurementSystem)}{" "}
                {measurementSystem === "metric" ? "kg" : "lbs"}
              </Text>
            </View>
            <Text style={[styles.label, { marginBottom: 10 }]}>
              {t("routines.exercises")}:
            </Text>
            {selectedItem?.exercises?.map((exercise: any, index: number) => {
              const exerciseName =
                exercise.exerciseDetails?.id
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                "Ejercicio";

              return (
                <View key={index} style={styles.exerciseListContainer}>
                  <Text style={styles.exerciseNameText}>• {exerciseName}</Text>
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
                      <Text key={setIdx} style={styles.setDetailsText}>
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

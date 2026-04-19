import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ExerciseType } from "../../hooks/useRoutines";
import { useTheme } from "../context/ThemeContext";
import { getStyles } from "../styles/Routines.styles";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMuscle: string | null;
  setSelectedMuscle: (m: string | null) => void;
  uniqueMuscles: string[];
  filteredExercises: ExerciseType[];
  tempSelectedExercises: ExerciseType[];
  toggleExerciseSelection: (ex: ExerciseType) => void;
  onConfirm: () => void;
}

/**
 * Modal para seleccionar ejercicios al crear o editar una rutina. Permite buscar por nombre, filtrar por grupo muscular y seleccionar múltiples ejercicios antes de confirmar la selección.
 * @param param0
 * @returns
 */
export const ExerciseSelectorModal = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  selectedMuscle,
  setSelectedMuscle,
  uniqueMuscles,
  filteredExercises,
  tempSelectedExercises,
  toggleExerciseSelection,
  onConfirm,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

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
            { height: "85%", backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("routines.addExercise")}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: scale(8),
              paddingHorizontal: scale(15),
              marginBottom: verticalScale(15),
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Feather
              name="search"
              size={scale(20)}
              color={colors.textSecondary}
            />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: verticalScale(12),
                paddingHorizontal: scale(10),
                color: colors.textPrimary,
                fontSize: moderateScale(14),
              }}
              placeholder={t("routines.searchExercise")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={{ marginBottom: verticalScale(15) }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={{
                  paddingHorizontal: scale(15),
                  paddingVertical: verticalScale(8),
                  borderRadius: scale(20),
                  marginRight: scale(10),
                  backgroundColor:
                    selectedMuscle === null ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    selectedMuscle === null ? colors.primary : colors.border,
                }}
                onPress={() => setSelectedMuscle(null)}
              >
                <Text
                  style={{
                    color:
                      selectedMuscle === null ? "#FFF" : colors.textPrimary,
                    fontWeight: "bold",
                    fontSize: moderateScale(14),
                  }}
                >
                  {t("routines.allMuscles")}
                </Text>
              </TouchableOpacity>

              {uniqueMuscles.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={{
                    paddingHorizontal: scale(15),
                    paddingVertical: verticalScale(8),
                    borderRadius: scale(20),
                    marginRight: scale(10),
                    backgroundColor:
                      selectedMuscle === muscle
                        ? colors.primary
                        : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      selectedMuscle === muscle
                        ? colors.primary
                        : colors.border,
                  }}
                  onPress={() => setSelectedMuscle(muscle)}
                >
                  <Text
                    style={{
                      color:
                        selectedMuscle === muscle ? "#FFF" : colors.textPrimary,
                      fontWeight: "bold",
                      fontSize: moderateScale(14),
                    }}
                  >
                    {t(`muscles.${muscle}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = tempSelectedExercises.some(
                (e) => e.id === item.id,
              );
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: verticalScale(15),
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => toggleExerciseSelection(item)}
                >
                  <View
                    style={{
                      width: scale(24),
                      height: scale(24),
                      borderRadius: scale(12),
                      borderWidth: 2,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.textSecondary,
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: scale(15),
                    }}
                  >
                    {isSelected && (
                      <Feather name="check" size={scale(16)} color="#FFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: moderateScale(16),
                        fontWeight: "bold",
                      }}
                    >
                      {t(`exercises.${item.id}`)}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: moderateScale(13),
                      }}
                    >
                      {t(`muscles.${item.muscleGroup}`)} •{" "}
                      {t(`equipment.${item.equipment}`)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {tempSelectedExercises.length > 0 && (
            <View
              style={{
                paddingTop: verticalScale(15),
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <PrimaryButton
                title={t("routines.addSelected", {
                  count: tempSelectedExercises.length,
                })}
                onPress={onConfirm}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

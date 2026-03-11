import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ExerciseSet,
  ExerciseType,
  Routine,
  RoutineExercise,
  useRoutines,
} from "../../hooks/useRoutines";
import { CustomInput } from "../../src/components/CustomInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { EXERCISE_DATABASE } from "../../src/constants/exercises";
import { colors } from "../../src/constants/theme";
import { styles } from "../../src/styles/RoutinesScreen.styles";

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { routines, isLoading, isSaving, saveRoutine, deleteRoutine } =
    useRoutines();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>(
    [],
  );
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [tempSelectedExercises, setTempSelectedExercises] = useState<
    ExerciseType[]
  >([]);

  const handleOpenModal = (routine?: Routine) => {
    if (routine) {
      setEditingRoutine(routine);
      setRoutineName(routine.name);
      setRoutineExercises(routine.exercises || []);
    } else {
      setEditingRoutine(null);
      setRoutineName("");
      setRoutineExercises([]);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRoutine(null);
    setRoutineName("");
    setRoutineExercises([]);
  };

  const handleSave = async () => {
    if (!routineName.trim()) return;
    try {
      await saveRoutine(
        editingRoutine ? editingRoutine.id : null,
        routineName,
        routineExercises,
      );
      handleCloseModal();
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

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
            handleCloseModal();
          },
        },
      ],
    );
  };

  const removeExerciseFromRoutine = (exerciseId: string) => {
    setRoutineExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  // Añadir una nueva serie (set) a un ejercicio específico dentro de la rutina
  const addSetToExercise = (routineExId: string) => {
    setRoutineExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === routineExId) {
          const newSet: ExerciseSet = {
            id: Math.random().toString(36).substr(2, 9),
            type: "normal",
            reps: 0,
            weight: 0,
            weightUnit: "kg",
            completed: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      }),
    );
  };

  const removeSetFromExercise = (routineExId: string, setId: string) => {
    setRoutineExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === routineExId) {
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
          };
        }
        return ex;
      }),
    );
  };

  //Seleccionar ejercicios para añadir a la rutina
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
          weightUnit: "kg",
          completed: false,
        },
      ],
    }));

    setRoutineExercises((prev) => [...prev, ...newExercises]);
    setExerciseModalVisible(false);
  };

  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((ex) => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle
        ? ex.targetMuscle === selectedMuscle
        : true;
      return matchesSearch && matchesMuscle;
    });
  }, [searchQuery, selectedMuscle]);

  const uniqueMuscles = useMemo(() => {
    const muscles = EXERCISE_DATABASE.map((ex) => ex.targetMuscle);
    return [...new Set(muscles)];
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t("routines.title")}</Text>
      </View>

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
            onPress={() => handleOpenModal(item)}
          >
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>{item.name}</Text>
              <Text style={styles.routineDetails}>
                {item.exercises?.length || 0} {t("routines.exercises")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.playButton}
              onPress={() =>
                router.push({
                  pathname: "/activeWorkout",
                  params: { routineId: item.id },
                })
              }
            >
              <Feather name="play" size={20} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
        <AntDesign name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/*Modal para crear/editar rutina*/}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoutine ? t("routines.edit") : t("routines.createNew")}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={styles.label}>{t("routines.routineName")}</Text>
              <CustomInput
                value={routineName}
                onChangeText={setRoutineName}
                placeholder={t("routines.routineNamePlaceholder")}
              />

              {/*Lista de ejercicios*/}
              <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>{t("routines.exercises")}</Text>

                {routineExercises.length === 0 ? (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontStyle: "italic",
                      marginBottom: 15,
                    }}
                  >
                    {t("routines.noExercises", "No hay ejercicios agregados.")}
                  </Text>
                ) : (
                  routineExercises.map((routineEx, index) => (
                    <View
                      key={routineEx.id}
                      style={{
                        backgroundColor: colors.surface,
                        padding: 15,
                        borderRadius: 10,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Cabecera del Ejercicio */}
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
                            {index + 1}. {routineEx.exerciseDetails.name}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 13,
                            }}
                          >
                            {routineEx.exerciseDetails.targetMuscle}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            removeExerciseFromRoutine(routineEx.id)
                          }
                          style={{ padding: 5 }}
                        >
                          <Feather name="trash-2" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/*Lista de Series*/}
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
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontWeight: "500",
                            }}
                          >
                            {t("routines.set", "Serie")} {setIndex + 1}
                          </Text>

                          <TouchableOpacity
                            onPress={() =>
                              removeSetFromExercise(routineEx.id, set.id)
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

                      {/*Botón Añadir Serie*/}
                      <TouchableOpacity
                        style={{
                          marginTop: 10,
                          flexDirection: "row",
                          alignItems: "center",
                          alignSelf: "flex-start",
                        }}
                        onPress={() => addSetToExercise(routineEx.id)}
                      >
                        <Feather
                          name="plus"
                          size={16}
                          color={colors.primary}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={{ color: colors.primary, fontWeight: "bold" }}
                        >
                          {t("routines.addSet", "Añadir Serie")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/*Botón para añadir ejercicio*/}
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
                onPress={openExerciseSelector}
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

              {/*Botones de guardar/eliminar*/}
              <View style={styles.buttonsRow}>
                {editingRoutine && (
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <SecondaryButton
                      title={t("routines.delete")}
                      onPress={() => handleDelete(editingRoutine.id)}
                      style={{ borderColor: "#EF4444" }}
                    />
                  </View>
                )}
                <View style={{ flex: 2 }}>
                  <PrimaryButton
                    title={t("routines.save")}
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={
                      !routineName.trim() || routineExercises.length === 0
                    }
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/*Modal para seleccionar ejercicio*/}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent={true}
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
              <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/*Buscador*/}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 15,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Feather name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  color: colors.textPrimary,
                }}
                placeholder={t("routines.searchExercise")}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/*Filtro por músculo*/}
            <View style={{ marginBottom: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 10,
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
                    }}
                  >
                    {t("routines.allMuscles", "Todos")}
                  </Text>
                </TouchableOpacity>

                {uniqueMuscles.map((muscle) => (
                  <TouchableOpacity
                    key={muscle}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                      marginRight: 10,
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
                          selectedMuscle === muscle
                            ? "#FFF"
                            : colors.textPrimary,
                        fontWeight: "bold",
                      }}
                    >
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/*Lista de ejercicios*/}
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
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                    onPress={() => toggleExerciseSelection(item)}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.textSecondary,
                        backgroundColor: isSelected
                          ? colors.primary
                          : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 15,
                      }}
                    >
                      {isSelected && (
                        <Feather name="check" size={16} color="#FFF" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 13 }}
                      >
                        {item.targetMuscle} • {item.equipment.replace("_", " ")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/*Botón de confirmación*/}
            {tempSelectedExercises.length > 0 && (
              <View
                style={{
                  paddingTop: 15,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <PrimaryButton
                  title={t("routines.addSelected", {
                    count: tempSelectedExercises.length,
                  })}
                  onPress={confirmSelectedExercises}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

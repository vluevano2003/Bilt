import {
  AntDesign,
  Feather,
  FontAwesome,
  FontAwesome5,
} from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { getStyles } from "../styles/Routines.styles";
import { CustomInput } from "./CustomInput";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

/**
 * Modal para mostrar los detalles de un ejercicio, con imagen (si existe), descripción y músculos trabajados, y opción a cerrar el modal
 * @param param0
 * @returns
 */
export const ExerciseDetailsModal = ({ visible, onClose, exercise }: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  if (!exercise) return null;

  const name = t(`exercises.${exercise.id}`);
  const description = t(`exerciseDetails.${exercise.id}.description`, {
    defaultValue: t(
      "routines.noExercises",
      "Descripción detallada próximamente...",
    ),
  });
  const submuscles = t(`exerciseDetails.${exercise.id}.submuscles`, {
    defaultValue: "Músculos secundarios no especificados.",
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayCentered}>
        <View
          style={[
            styles.modalContentCentered,
            {
              paddingHorizontal: 0,
              paddingBottom: 0,
              paddingTop: 25,
              maxHeight: "80%",
            },
          ]}
        >
          <View style={[styles.modalHeader, { paddingHorizontal: 25 }]}>
            <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={2}>
              {name}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: 25,
              paddingBottom: Math.max(80, insets.bottom + 40),
            }}
          >
            {exercise.imageUrl ? (
              <Image
                source={{ uri: exercise.imageUrl }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 15,
                  marginBottom: 25,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 200,
                  backgroundColor: colors.surface,
                  borderRadius: 15,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 25,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <FontAwesome5
                  name="image"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 10,
                    fontSize: 12,
                  }}
                >
                  {t("routines.animationComingSoon", "Animación próximamente")}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                {t("activeWorkout.musclesWorked", "Músculos trabajados")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(234, 88, 12, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {t("routines.synergists", "Sinérgicos")}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    flexShrink: 1,
                  }}
                >
                  {submuscles}
                </Text>
              </View>
            </View>

            <View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                {t("routines.instructions", "Instrucciones")}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 15,
                  lineHeight: 24,
                }}
              >
                {description}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para crear un nuevo pack semanal, con campos para nombre y descripción, listado de rutinas propias para seleccionar (hasta 6) y botón para guardar el pack
 * @param param0
 * @returns
 */
export const CreatePackModal = ({
  visible,
  onClose,
  packName,
  setPackName,
  packDescription,
  setPackDescription,
  selectedRoutineIds,
  toggleRoutineSelection,
  setReorderedRoutineIds,
  routines,
  handleCreatePack,
  isSavingPack,
  isEditing,
}: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const availableRoutines = routines.filter(
    (r: any) => !r.originalCreatorId && !selectedRoutineIds.includes(r.id),
  );

  const renderDraggableSelectedRoutine = ({
    item: routineId,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<string>) => {
    const routine = routines.find((r: any) => r.id === routineId);
    if (!routine) return null;
    const index = getIndex() || 0;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          delayLongPress={150}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isActive ? colors.background : colors.surface,
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: isActive ? colors.primary : colors.border,
            elevation: isActive ? 5 : 0,
          }}
        >
          <TouchableOpacity
            onPress={() => toggleRoutineSelection(routine.id)}
            style={{ marginRight: 15 }}
          >
            <Feather name="minus-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {t("common.day", "Día")} {index + 1}: {routine.name}
            </Text>
          </View>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlayBottomSheet}>
            <View
              style={[
                styles.modalContentBottomSheet,
                {
                  paddingHorizontal: 0,
                  paddingBottom: 0,
                  paddingTop: 25,
                  maxHeight: "85%",
                },
              ]}
            >
              <View style={[styles.modalHeader, { paddingHorizontal: 25 }]}>
                <Text style={styles.modalTitle}>
                  {isEditing
                    ? t("weeklyPacks.edit", "Editar Pack Semanal")
                    : t("weeklyPacks.createNew", "Crear Pack Semanal")}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <AntDesign
                    name="close"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <DraggableFlatList
                style={{ flexShrink: 1 }}
                showsVerticalScrollIndicator={true}
                data={selectedRoutineIds}
                onDragEnd={({ data }) => setReorderedRoutineIds(data)}
                keyExtractor={(item) => item}
                contentContainerStyle={{
                  paddingHorizontal: 25,
                  paddingBottom: Math.max(80, insets.bottom + 40),
                }}
                ListHeaderComponent={
                  <View style={{ paddingBottom: 15 }}>
                    <Text style={styles.label}>
                      {t("weeklyPacks.packName", "Nombre del Pack")}
                    </Text>
                    <CustomInput
                      value={packName}
                      onChangeText={setPackName}
                      placeholder={t(
                        "weeklyPacks.packNamePlaceholder",
                        "Ej. Semana de Hipertrofia",
                      )}
                    />
                    <Text style={[styles.label, { marginTop: 15 }]}>
                      {t("weeklyPacks.description", "Descripción")}
                    </Text>
                    <CustomInput
                      value={packDescription}
                      onChangeText={setPackDescription}
                      placeholder={t(
                        "weeklyPacks.descriptionPlaceholder",
                        "Ej. Rutina de 5 días...",
                      )}
                    />

                    <Text
                      style={[
                        styles.label,
                        { marginTop: 25, marginBottom: 10 },
                      ]}
                    >
                      {t(
                        "weeklyPacks.availableRoutines",
                        "Rutinas Disponibles para Añadir",
                      )}
                    </Text>

                    {availableRoutines.length === 0 && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontStyle: "italic",
                          marginBottom: 10,
                        }}
                      >
                        {t(
                          "weeklyPacks.noMoreRoutines",
                          "No hay más rutinas disponibles o llegaste al límite.",
                        )}
                      </Text>
                    )}

                    {availableRoutines.map((routine: any) => (
                      <TouchableOpacity
                        key={routine.id}
                        onPress={() => toggleRoutineSelection(routine.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 15,
                          borderRadius: 10,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        }}
                      >
                        <Feather
                          name="plus-circle"
                          size={20}
                          color={colors.primary}
                          style={{ marginRight: 15 }}
                        />
                        <Text
                          style={{ color: colors.textPrimary, fontSize: 16 }}
                        >
                          {routine.name}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 25,
                        marginBottom: 15,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: 20,
                      }}
                    >
                      <Text style={styles.label}>
                        {t(
                          "weeklyPacks.selectedRoutinesTitle",
                          "Días de Entrenamiento",
                        )}
                      </Text>
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        {t("weeklyPacks.routinesSelected", {
                          count: selectedRoutineIds.length,
                        })}
                      </Text>
                    </View>

                    {selectedRoutineIds.length === 0 && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontStyle: "italic",
                        }}
                      >
                        {t(
                          "weeklyPacks.dragHint",
                          "Añade rutinas para ordenar tus días de entrenamiento.",
                        )}
                      </Text>
                    )}
                  </View>
                }
                renderItem={renderDraggableSelectedRoutine}
                ListFooterComponent={
                  <View style={{ marginTop: 30, marginBottom: 20 }}>
                    <PrimaryButton
                      title={
                        isEditing
                          ? t("common.saveChanges", "Guardar Cambios")
                          : t("weeklyPacks.savePack", "Crear Pack")
                      }
                      onPress={handleCreatePack}
                      loading={isSavingPack}
                      disabled={
                        !packName.trim() || selectedRoutineIds.length === 0
                      }
                    />
                  </View>
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

/**
 * Modal para mostrar los detalles de un pack semanal guardado, con opción a iniciar cada rutina o eliminar el pack del perfil
 * @param param0
 * @returns
 */
export const PackDetailsModal = ({
  visible,
  onClose,
  pack,
  routines,
  handleDeletePack,
  startWorkoutAndClose,
  onEditPack,
}: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  if (!pack) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayBottomSheet}>
        <View
          style={[
            styles.modalContentBottomSheet,
            {
              paddingHorizontal: 0,
              paddingBottom: 0,
              paddingTop: 25,
              maxHeight: "85%",
            },
          ]}
        >
          <View style={[styles.modalHeader, { paddingHorizontal: 25 }]}>
            <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={1}>
              {pack.name}
            </Text>
            {!pack.originalCreatorId && (
              <TouchableOpacity
                onPress={() => onEditPack(pack)}
                style={{ marginRight: 20 }}
              >
                <Feather name="edit-2" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: 25,
              paddingBottom: Math.max(40, insets.bottom + 20),
            }}
          >
            {pack.description && (
              <Text
                style={{
                  color: colors.textSecondary,
                  marginBottom: 20,
                  fontSize: 15,
                }}
              >
                {pack.description}
              </Text>
            )}
            <Text style={[styles.label, { marginBottom: 15 }]}>
              {t("weeklyPacks.routinesIncluded", "Rutinas en este Pack:")}
            </Text>
            {pack.routineIds.map((rId: string, idx: number) => {
              const routine = routines.find((r: any) => r.id === rId);
              if (!routine) return null;
              const exercisesPreview =
                routine.exercises
                  ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                  .join(", ") || t("routines.noExercises", "Sin ejercicios");
              return (
                <View
                  key={routine.id + idx}
                  style={[
                    styles.routineCard,
                    { padding: 15, marginBottom: 15 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.routineName}>
                      {t("common.day", "Día")} {idx + 1}: {routine.name}
                    </Text>
                  </View>
                  <Text style={styles.exercisePreview} numberOfLines={2}>
                    {exercisesPreview}
                  </Text>
                  <TouchableOpacity
                    style={styles.startRoutineButton}
                    onPress={() => startWorkoutAndClose(routine)}
                  >
                    <Text style={styles.startRoutineText}>
                      {t("routines.startWorkout")}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  marginTop: 20,
                  backgroundColor: "transparent",
                  borderColor: "#EF4444",
                  flexDirection: "row",
                  justifyContent: "center",
                },
              ]}
              onPress={() => handleDeletePack(pack.id)}
            >
              <Feather
                name="trash-2"
                size={18}
                color="#EF4444"
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                {pack.originalCreatorId
                  ? t("routines.removeFromProfile", "Remover de mi perfil")
                  : t("routines.delete", "Eliminar")}{" "}
                Pack
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para mostrar una rutina guardada en modo solo lectura, con opción a eliminarla del perfil
 * @param param0
 * @returns
 */
export const ReadonlyRoutineModal = ({
  visible,
  onClose,
  routine,
  handleUnsave,
}: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [detailsExercise, setDetailsExercise] = useState<any | null>(null);

  if (!routine) return null;
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlayBottomSheet}>
          <View
            style={[
              styles.modalContentBottomSheet,
              {
                paddingHorizontal: 0,
                paddingBottom: 0,
                paddingTop: 25,
                maxHeight: "85%",
              },
            ]}
          >
            <View style={[styles.modalHeader, { paddingHorizontal: 25 }]}>
              <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={1}>
                {routine.name}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{
                paddingHorizontal: 25,
                paddingBottom: Math.max(40, insets.bottom + 20),
              }}
            >
              <Text style={[styles.label, { marginBottom: 10 }]}>
                {t("routines.exercises")}:
              </Text>
              {routine.exercises?.map((exercise: any, index: number) => {
                return (
                  <View
                    key={index}
                    style={{ marginBottom: 15, paddingLeft: 10 }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setDetailsExercise(exercise.exerciseDetails)
                      }
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 16,
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        • {t(`exercises.${exercise.exerciseDetails?.id}`)}
                      </Text>
                    </TouchableOpacity>

                    {exercise.sets && exercise.sets.length > 0 && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          marginLeft: 15,
                          fontSize: 14,
                        }}
                      >
                        {t("routines.n_sets", {
                          count: exercise.sets.length,
                          defaultValue: `${exercise.sets.length} Series`,
                        })}
                      </Text>
                    )}
                  </View>
                );
              })}
              {(!routine.exercises || routine.exercises.length === 0) && (
                <Text style={{ color: colors.textSecondary }}>
                  No hay ejercicios en esta rutina.
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    marginTop: 30,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                ]}
                onPress={() => handleUnsave(routine.id)}
              >
                <FontAwesome
                  name="bookmark"
                  size={18}
                  color={colors.textPrimary}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t("routines.removeFromProfile")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ExerciseDetailsModal
        visible={!!detailsExercise}
        onClose={() => setDetailsExercise(null)}
        exercise={detailsExercise}
      />
    </>
  );
};

/**
 * Modal para crear o editar una rutina, con drag-and-drop para reordenar ejercicios y opción a eliminar la rutina si ya estaba guardada
 * @param param0
 * @returns
 */
export const RoutineEditorModal = ({ editor, isSaving, handleDelete }: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [detailsExercise, setDetailsExercise] = useState<any | null>(null);

  const renderDraggableExercise = ({
    item: routineEx,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<any>) => {
    const index = getIndex() || 0;
    return (
      <ScaleDecorator>
        <View
          style={{
            backgroundColor: isActive ? colors.background : colors.surface,
            paddingVertical: 15,
            paddingLeft: 15,
            paddingRight: 5,
            borderRadius: 10,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: isActive ? colors.primary : colors.border,
            elevation: isActive ? 10 : 0,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => setDetailsExercise(routineEx.exerciseDetails)}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {index + 1}. {t(`exercises.${routineEx.exerciseDetails.id}`)}{" "}
                  <Feather name="info" size={14} color={colors.textSecondary} />
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {t(`muscles.${routineEx.exerciseDetails.muscleGroup}`)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => editor.removeExercise(routineEx.id)}
                style={{ padding: 8, marginRight: 2 }}
              >
                <Feather name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                style={{ padding: 8 }}
              >
                <Feather name="menu" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {routineEx.sets.map((set: any, setIndex: number) => (
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
                marginRight: 10,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "500" }}>
                {t("routines.set", "Serie")} {setIndex + 1}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  editor.removeSetFromExercise(routineEx.id, set.id)
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
          <TouchableOpacity
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
            }}
            onPress={() => editor.addSetToExercise(routineEx.id)}
          >
            <Feather
              name="plus"
              size={16}
              color={colors.primary}
              style={{ marginRight: 5 }}
            />
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              {t("routines.addSet", "Añadir Serie")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <>
      <Modal
        visible={editor.modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={editor.closeRoutineModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlayBottomSheet}>
              <View
                style={[
                  styles.modalContentBottomSheet,
                  {
                    paddingHorizontal: 0,
                    paddingBottom: 0,
                    paddingTop: 25,
                    maxHeight: "85%",
                  },
                ]}
              >
                <View style={[styles.modalHeader, { paddingHorizontal: 25 }]}>
                  <Text
                    style={[styles.modalTitle, { flex: 1 }]}
                    numberOfLines={1}
                  >
                    {editor.editingRoutine
                      ? t("routines.edit")
                      : t("routines.createNew")}
                  </Text>
                  <TouchableOpacity onPress={editor.closeRoutineModal}>
                    <AntDesign
                      name="close"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <DraggableFlatList
                  style={{ flexShrink: 1 }}
                  showsVerticalScrollIndicator={true}
                  data={editor.routineExercises}
                  onDragEnd={({ data }) => editor.reorderExercises(data)}
                  keyExtractor={(item) => item.id}
                  renderItem={renderDraggableExercise}
                  contentContainerStyle={{
                    paddingHorizontal: 25,
                    paddingBottom: Math.max(120, insets.bottom + 60),
                  }}
                  ListHeaderComponent={
                    <View style={{ marginBottom: 20 }}>
                      <Text style={styles.label}>
                        {t("routines.routineName")}
                      </Text>
                      <CustomInput
                        value={editor.routineName}
                        onChangeText={editor.setRoutineName}
                        placeholder={t("routines.routineNamePlaceholder")}
                      />
                      <Text style={[styles.label, { marginTop: 20 }]}>
                        {t("routines.exercises")}
                      </Text>
                      {editor.routineExercises.length === 0 && (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontStyle: "italic",
                            marginBottom: 15,
                          }}
                        >
                          {t("routines.noExercises")}
                        </Text>
                      )}
                    </View>
                  }
                  ListFooterComponent={
                    <View>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 12,
                          backgroundColor: "rgba(234, 88, 12, 0.1)",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          borderStyle: "dashed",
                          marginBottom: 20,
                          marginTop: 10,
                        }}
                        onPress={editor.openExerciseSelector}
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
                      <View style={styles.buttonsRow}>
                        {editor.editingRoutine && (
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <SecondaryButton
                              title={t("routines.delete")}
                              onPress={() =>
                                handleDelete(editor.editingRoutine!.id)
                              }
                              style={{ borderColor: "#EF4444" }}
                            />
                          </View>
                        )}
                        <View style={{ flex: 2 }}>
                          <PrimaryButton
                            title={t("routines.save")}
                            onPress={editor.handleSaveRoutine}
                            loading={isSaving}
                            disabled={
                              !editor.routineName.trim() ||
                              editor.routineExercises.length === 0
                            }
                          />
                        </View>
                      </View>
                    </View>
                  }
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
      <ExerciseDetailsModal
        visible={!!detailsExercise}
        onClose={() => setDetailsExercise(null)}
        exercise={detailsExercise}
      />
    </>
  );
};

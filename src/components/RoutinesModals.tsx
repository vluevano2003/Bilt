import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
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
import { colors } from "../constants/theme";
import { styles } from "../styles/Routines.styles";
import { CustomInput } from "./CustomInput";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

/**
 * Modal para crear un nuevo pack semanal. Permite ingresar nombre, descripción y seleccionar hasta 6 rutinas propias para incluir en el pack
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
  routines,
  handleCreatePack,
  isSavingPack,
}: any) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { height: "85%", padding: 25 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("weeklyPacks.createNew", "Crear Pack Semanal")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
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

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              <Text style={styles.label}>
                {t("weeklyPacks.selectRoutines", "Selecciona hasta 6 rutinas")}
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

            {routines.filter((r: any) => !r.originalCreatorId).length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontStyle: "italic",
                  marginTop: 10,
                }}
              >
                {t(
                  "weeklyPacks.noRoutinesAvailable",
                  "Crea algunas rutinas primero para armar un pack.",
                )}
              </Text>
            ) : (
              routines
                .filter((r: any) => !r.originalCreatorId)
                .map((routine: any) => {
                  const isSelected = selectedRoutineIds.includes(routine.id);
                  return (
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
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                        backgroundColor: isSelected
                          ? "rgba(34, 197, 94, 0.1)"
                          : colors.surface,
                      }}
                    >
                      <Feather
                        name={isSelected ? "check-circle" : "circle"}
                        size={20}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                        style={{ marginRight: 15 }}
                      />
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: isSelected ? "bold" : "normal",
                        }}
                      >
                        {routine.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
            )}
            <View style={{ marginTop: 30, marginBottom: 50 }}>
              <PrimaryButton
                title={t("weeklyPacks.savePack", "Guardar Pack")}
                onPress={handleCreatePack}
                loading={isSavingPack}
                disabled={!packName.trim() || selectedRoutineIds.length === 0}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/**
 * Modal para mostrar los detalles de un pack semanal, incluyendo su descripción y las rutinas que contiene. Desde este modal también se puede iniciar un workout con alguna de las rutinas o eliminar el pack si es propio o removerlo del perfil si es ajeno
 */
export const PackDetailsModal = ({
  visible,
  onClose,
  pack,
  routines,
  handleDeletePack,
  startWorkoutAndClose,
}: any) => {
  const { t } = useTranslation();
  if (!pack) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: "85%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pack.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
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
            {pack.routineIds.map((rId: string) => {
              const routine = routines.find((r: any) => r.id === rId);
              if (!routine) return null;
              const exercisesPreview =
                routine.exercises
                  ?.map((ex: any) => t(`exercises.${ex.exerciseDetails.id}`))
                  .join(", ") || t("routines.noExercises", "Sin ejercicios");
              return (
                <View
                  key={routine.id}
                  style={[
                    styles.routineCard,
                    { padding: 15, marginBottom: 15 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.routineName}>{routine.name}</Text>
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
 * Modal para mostrar los detalles de una rutina ajena a modo de vista previa. Desde este modal se puede remover la rutina del perfil si es ajena o eliminarla si es propia
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
  if (!routine) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{routine.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { marginBottom: 10 }]}>
              {t("routines.exercises")}:
            </Text>
            {routine.exercises?.map((exercise: any, index: number) => {
              const exerciseName =
                exercise.exerciseDetails?.id
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                "Ejercicio";
              return (
                <View key={index} style={{ marginBottom: 15, paddingLeft: 10 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "bold",
                      marginBottom: 5,
                    }}
                  >
                    • {exerciseName}
                  </Text>
                  {exercise.sets?.map((set: any, setIdx: number) => (
                    <Text
                      key={setIdx}
                      style={{
                        color: colors.textSecondary,
                        marginLeft: 15,
                        fontSize: 14,
                      }}
                    >
                      Set {setIdx + 1}: {set.reps} reps
                    </Text>
                  ))}
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
                style={[styles.actionButtonText, { color: colors.textPrimary }]}
              >
                {t("routines.removeFromProfile")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para editar una rutina propia. Permite modificar el nombre, agregar/quitar ejercicios y sets, reordenar los ejercicios por drag and drop, eliminar la rutina o guardarla con los cambios realizados
 * @param param0
 * @returns
 */
export const RoutineEditorModal = ({ editor, isSaving, handleDelete }: any) => {
  const { t } = useTranslation();

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
            padding: 15,
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
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {index + 1}. {t(`exercises.${routineEx.exerciseDetails.id}`)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {t(`muscles.${routineEx.exerciseDetails.muscleGroup}`)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => editor.removeExercise(routineEx.id)}
                style={{ padding: 5, marginRight: 10 }}
              >
                <Feather name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                style={{ padding: 5 }}
              >
                <Feather name="menu" size={22} color={colors.textSecondary} />
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
    <Modal
      visible={editor.modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={editor.closeRoutineModal}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: "90%", padding: 0 }]}>
            <View
              style={[
                styles.modalHeader,
                { paddingHorizontal: 25, paddingTop: 25 },
              ]}
            >
              <Text style={styles.modalTitle}>
                {editor.editingRoutine
                  ? t("routines.edit")
                  : t("routines.createNew")}
              </Text>
              <TouchableOpacity onPress={editor.closeRoutineModal}>
                <AntDesign name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <DraggableFlatList
              data={editor.routineExercises}
              onDragEnd={({ data }) => editor.reorderExercises(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderDraggableExercise}
              contentContainerStyle={{
                paddingHorizontal: 25,
                paddingBottom: 100,
              }}
              ListHeaderComponent={
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>{t("routines.routineName")}</Text>
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
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
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
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

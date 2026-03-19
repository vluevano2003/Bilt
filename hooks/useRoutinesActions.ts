import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { WeeklyPack } from "./useWeeklyPacks";

/**
 * Hook para manejar las acciones relacionadas con rutinas y packs semanales
 * @param packs
 * @param deleteRoutine
 * @param deletePack
 * @param saveWeeklyPack
 * @param closeEditorModal
 * @returns
 */
export const useRoutinesActions = (
  packs: WeeklyPack[],
  deleteRoutine: (id: string) => void,
  deletePack: (id: string) => Promise<void>,
  saveWeeklyPack: (name: string, desc: string, ids: string[]) => Promise<void>,
  closeEditorModal: () => void,
) => {
  const { t } = useTranslation();

  const [packModalVisible, setPackModalVisible] = useState(false);
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);

  const handleDelete = (routineId: string, onSuccess: () => void) => {
    const isRoutineInPack = packs.some(
      (p) => !p.originalCreatorId && p.routineIds.includes(routineId),
    );

    if (isRoutineInPack) {
      Alert.alert(
        t("alerts.error", "Atención"),
        t("routines.cannotDeleteInPack"),
      );
      return;
    }

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
            closeEditorModal();
            onSuccess();
          },
        },
      ],
    );
  };

  /**
   * Maneja la acción de "desguardar" una rutina, verificando si está vinculada a un pack semanal creado por el usuario
   * @param routineId
   * @param onSuccess
   * @returns
   */
  const handleUnsaveRoutine = (routineId: string, onSuccess: () => void) => {
    const linkedPack = packs.find(
      (p) => p.originalCreatorId && p.routineIds.includes(routineId),
    );

    if (linkedPack) {
      Alert.alert(
        t("routines.unsaveConfirmTitle"),
        t("routines.unsavePackWarning", { packName: linkedPack.name }),
        [
          { text: t("routines.cancel"), style: "cancel" },
          {
            text: t("routines.removeFromProfile"),
            style: "destructive",
            onPress: async () => {
              await deletePack(linkedPack.id);
              for (const rId of linkedPack.routineIds) {
                await deleteRoutine(rId);
              }
              onSuccess();
              Alert.alert(
                t("profile.alerts.success"),
                t("routines.successRemoved"),
              );
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      t("routines.unsaveConfirmTitle"),
      t("routines.unsaveConfirmMsg"),
      [
        { text: t("routines.cancel"), style: "cancel" },
        {
          text: t("routines.removeFromProfile"),
          style: "destructive",
          onPress: async () => {
            await deleteRoutine(routineId);
            onSuccess();
            Alert.alert(
              t("profile.alerts.success"),
              t("routines.successRemoved"),
            );
          },
        },
      ],
    );
  };

  const toggleRoutineSelection = (id: string) => {
    if (selectedRoutineIds.includes(id)) {
      setSelectedRoutineIds((prev) => prev.filter((rId) => rId !== id));
    } else {
      if (selectedRoutineIds.length >= 6) {
        Alert.alert(
          t("alerts.error", "Límite alcanzado"),
          t("weeklyPacks.maxRoutinesAlert", "Máximo 6 rutinas."),
        );
        return;
      }
      setSelectedRoutineIds((prev) => [...prev, id]);
    }
  };

  const handleCreatePack = async () => {
    await saveWeeklyPack(packName, packDescription, selectedRoutineIds);
    setPackModalVisible(false);
    setPackName("");
    setPackDescription("");
    setSelectedRoutineIds([]);
  };

  const handleDeletePack = (packId: string, onSuccess: () => void) => {
    Alert.alert(
      t("routines.deleteConfirmTitle", "Eliminar Pack"),
      t(
        "routines.deleteConfirmMsg",
        "¿Estás seguro de que deseas eliminar este pack?",
      ),
      [
        { text: t("routines.cancel"), style: "cancel" },
        {
          text: t("routines.yesDelete"),
          style: "destructive",
          onPress: async () => {
            const packToDelete = packs.find((p) => p.id === packId);
            await deletePack(packId);
            if (packToDelete?.originalCreatorId) {
              for (const rId of packToDelete.routineIds) {
                await deleteRoutine(rId);
              }
            }
            onSuccess();
          },
        },
      ],
    );
  };

  return {
    packModalVisible,
    setPackModalVisible,
    packName,
    setPackName,
    packDescription,
    setPackDescription,
    selectedRoutineIds,
    handleDelete,
    handleUnsaveRoutine,
    toggleRoutineSelection,
    handleCreatePack,
    handleDeletePack,
  };
};

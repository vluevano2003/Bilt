import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { WeeklyPack } from "./useWeeklyPacks";

/**
 * Hook para manejar acciones relacionadas con rutinas y packs, como eliminar, desguardar y crear packs
 * @param packs
 * @param deleteRoutine
 * @param deletePack
 * @param saveWeeklyPack
 * @param closeEditorModal
 * @returns
 */
export const useRoutinesActions = (
  packs: WeeklyPack[],
  deleteRoutine: (id: string) => Promise<void>,
  deletePack: (id: string) => Promise<void>,
  saveWeeklyPack: (
    name: string,
    desc: string,
    ids: string[],
    origCreatorId?: string,
    origCreatorName?: string,
    origPackId?: string,
    packIdToUpdate?: string,
  ) => Promise<void>,
  closeEditorModal: () => void,
) => {
  const { t } = useTranslation();

  const [packModalVisible, setPackModalVisible] = useState(false);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);

  const openPackModal = (pack?: WeeklyPack) => {
    if (pack) {
      setEditingPackId(pack.id);
      setPackName(pack.name);
      setPackDescription(pack.description || "");
      setSelectedRoutineIds(pack.routineIds || []);
    } else {
      setEditingPackId(null);
      setPackName("");
      setPackDescription("");
      setSelectedRoutineIds([]);
    }
    setPackModalVisible(true);
  };

  const handleCreatePack = async () => {
    await saveWeeklyPack(
      packName,
      packDescription,
      selectedRoutineIds,
      undefined,
      undefined,
      undefined,
      editingPackId || undefined,
    );
    setPackModalVisible(false);
    setEditingPackId(null);
    setPackName("");
    setPackDescription("");
    setSelectedRoutineIds([]);
  };

  const toggleRoutineSelection = (id: string) => {
    if (selectedRoutineIds.includes(id)) {
      setSelectedRoutineIds((prev) => prev.filter((rId) => rId !== id));
    } else {
      if (selectedRoutineIds.length >= 6) {
        Alert.alert(
          t("alerts.limitReached", "Límite alcanzado"),
          t("weeklyPacks.maxRoutinesAlert", "Máximo 6 rutinas."),
        );
        return;
      }
      setSelectedRoutineIds((prev) => [...prev, id]);
    }
  };

  const setReorderedRoutineIds = (newOrder: string[]) => {
    setSelectedRoutineIds(newOrder);
  };

  const handleDelete = (routineId: string, onSuccess: () => void) => {
    const isRoutineInPack = packs.some(
      (p) => !p.originalCreatorId && p.routineIds.includes(routineId),
    );

    if (isRoutineInPack) {
      Alert.alert(
        t("alerts.error", "Atención"),
        t(
          "routines.cannotDeleteInPack",
          "No puedes eliminar una rutina que está en un pack.",
        ),
      );
      return;
    }

    Alert.alert(
      t("routines.deleteConfirmTitle", "Eliminar Rutina"),
      t("routines.deleteConfirmMsg", "¿Seguro que deseas eliminarla?"),
      [
        { text: t("routines.cancel", "Cancelar"), style: "cancel" },
        {
          text: t("routines.yesDelete", "Sí, eliminar"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              closeEditorModal();
              onSuccess();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar la rutina.",
              );
            }
          },
        },
      ],
    );
  };

  /**
   * Maneja el proceso de desguardar una rutina, verificando si está en un pack y mostrando alertas de confirmación
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
        t("routines.unsaveConfirmTitle", "Desguardar"),
        t("routines.unsavePackWarning", { packName: linkedPack.name }),
        [
          { text: t("routines.cancel", "Cancelar"), style: "cancel" },
          {
            text: t("routines.removeFromProfile", "Remover"),
            style: "destructive",
            onPress: async () => {
              try {
                await deletePack(linkedPack.id);
                for (const rId of linkedPack.routineIds) {
                  await deleteRoutine(rId);
                }
                onSuccess();
                Alert.alert(
                  t("profile.alerts.success", "Éxito"),
                  t("routines.successRemoved", "Removido de tu perfil."),
                );
              } catch (error: any) {
                Alert.alert("Error", error.message || "Fallo al desguardar.");
              }
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      t("routines.unsaveConfirmTitle", "Desguardar"),
      t("routines.unsaveConfirmMsg", "¿Seguro?"),
      [
        { text: t("routines.cancel", "Cancelar"), style: "cancel" },
        {
          text: t("routines.removeFromProfile", "Remover"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              onSuccess();
              Alert.alert(
                t("profile.alerts.success", "Éxito"),
                t("routines.successRemoved", "Removido de tu perfil."),
              );
            } catch (error: any) {
              Alert.alert("Error", error.message || "Fallo al desguardar.");
            }
          },
        },
      ],
    );
  };

  const handleDeletePack = (packId: string, onSuccess: () => void) => {
    Alert.alert(
      t("routines.deleteConfirmTitle", "Eliminar Pack"),
      t(
        "routines.deleteConfirmMsg",
        "¿Estás seguro de que deseas eliminar este pack?",
      ),
      [
        { text: t("routines.cancel", "Cancelar"), style: "cancel" },
        {
          text: t("routines.yesDelete", "Sí, eliminar"),
          style: "destructive",
          onPress: async () => {
            try {
              const packToDelete = packs.find((p) => p.id === packId);
              await deletePack(packId);

              if (packToDelete?.originalCreatorId) {
                for (const rId of packToDelete.routineIds) {
                  await deleteRoutine(rId);
                }
              }
              onSuccess();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar el pack.",
              );
            }
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
    toggleRoutineSelection,
    handleCreatePack,
    handleDeletePack,
    handleDelete,
    handleUnsaveRoutine,
    openPackModal,
    setReorderedRoutineIds,
    editingPackId,
  };
};

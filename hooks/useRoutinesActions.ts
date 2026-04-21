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
          t("alerts.limitReached"),
          t("weeklyPacks.maxRoutinesAlert"),
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
      Alert.alert(t("alerts.error"), t("routines.cannotDeleteInPack"));
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
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              closeEditorModal();
              onSuccess();
            } catch (error: any) {
              Alert.alert(
                t("alerts.error"),
                error.message || t("routines.deleteError"),
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
        t("routines.unsaveConfirmTitle"),
        t("routines.unsavePackWarning", { packName: linkedPack.name }),
        [
          { text: t("routines.cancel"), style: "cancel" },
          {
            text: t("routines.removeFromProfile"),
            style: "destructive",
            onPress: async () => {
              try {
                await deletePack(linkedPack.id);
                for (const rId of linkedPack.routineIds) {
                  await deleteRoutine(rId);
                }
                onSuccess();
                Alert.alert(
                  t("profile.alerts.success"),
                  t("routines.successRemoved"),
                );
              } catch (error: any) {
                Alert.alert(
                  t("alerts.error"),
                  error.message || t("routines.unsaveError"),
                );
              }
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
            try {
              await deleteRoutine(routineId);
              onSuccess();
              Alert.alert(
                t("profile.alerts.success"),
                t("routines.successRemoved"),
              );
            } catch (error: any) {
              Alert.alert(
                t("alerts.error"),
                error.message || t("routines.unsaveError"),
              );
            }
          },
        },
      ],
    );
  };

  const handleDeletePack = (packId: string, onSuccess: () => void) => {
    Alert.alert(
      t("routines.deleteConfirmTitle"),

      t("routines.deleteConfirmMsg"),
      [
        { text: t("routines.cancel"), style: "cancel" },
        {
          text: t("routines.yesDelete"),
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
                t("alerts.error"),
                error.message || t("routines.deleteError"),
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

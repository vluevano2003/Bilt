import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { auth, db } from "../src/config/firebase";
import { useRoutines } from "./useRoutines";
import { useWeeklyPacks, WeeklyPack } from "./useWeeklyPacks";

/**
 * Custom hook para manejar las acciones de guardar/guardar rutinas y packs en el perfil de un usuario
 * @param profileId
 * @param username
 * @param userRoutines
 * @returns
 */
export const useProfileActions = (
  profileId: string | undefined,
  username: string,
  userRoutines: any[],
) => {
  const { t } = useTranslation();
  const { routines: myRoutines, deleteRoutine } = useRoutines();
  const { packs: myPacks, saveWeeklyPack, deletePack } = useWeeklyPacks();
  const [isSavingFullPack, setIsSavingFullPack] = useState(false);

  const getSavedRoutineId = (originalRoutineId: string) => {
    const found = myRoutines.find(
      (r) => r.originalRoutineId === originalRoutineId,
    );
    return found ? found.id : null;
  };

  const getSavedPackId = (originalPackId: string) => {
    const found = myPacks.find((p) => p.originalPackId === originalPackId);
    return found ? found.id : null;
  };

  /**
   * Maneja la lógica para guardar o eliminar una rutina del perfil del usuario. Si la rutina ya está guardada, se eliminará. Si no, se guardará. Si la rutina está vinculada a un pack guardado, se mostrará una alerta para confirmar la eliminación del pack completo
   * @param routineToToggle
   * @param onComplete
   * @returns
   */
  const handleToggleSaveRoutine = async (
    routineToToggle: any,
    onComplete?: () => void,
  ) => {
    const savedId = getSavedRoutineId(routineToToggle.id);

    if (savedId) {
      const linkedPack = myPacks.find((p) => p.routineIds.includes(savedId));

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
                if (onComplete) onComplete();
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

      try {
        await deleteRoutine(savedId);
        Alert.alert(t("profile.alerts.success"), t("routines.successRemoved"));
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    } else {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      try {
        const myRoutinesRef = collection(
          db,
          "users",
          currentUserId,
          "routines",
        );
        await addDoc(myRoutinesRef, {
          name: routineToToggle.name,
          exercises: routineToToggle.exercises,
          createdAt: Date.now(),
          originalCreatorId: profileId,
          originalCreatorName: username,
          originalRoutineId: routineToToggle.id,
        });

        Alert.alert(t("profile.alerts.success"), t("routines.successSaved"));
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    }
  };

  /**
   * Similar a handleToggleSaveRoutine, pero para packs semanales. Si el pack ya está guardado, se eliminará junto con sus rutinas vinculadas. Si no está guardado, se guardará junto con las rutinas vinculadas (creando copias locales de cada rutina)
   * @param selectedPack
   * @param onComplete
   * @returns
   */
  const handleToggleSavePack = async (
    selectedPack: WeeklyPack | null,
    onComplete?: () => void,
  ) => {
    if (!selectedPack || !auth.currentUser) return;

    const savedPackId = getSavedPackId(selectedPack.id);

    if (savedPackId) {
      setIsSavingFullPack(true);
      try {
        const packToDelete = myPacks.find((p) => p.id === savedPackId);
        await deletePack(savedPackId);

        if (packToDelete && packToDelete.routineIds) {
          for (const rId of packToDelete.routineIds) {
            await deleteRoutine(rId);
          }
        }

        Alert.alert(
          t("profile.alerts.success", "Éxito"),
          t("routines.successRemoved", "Pack removido de tu perfil."),
        );
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("alerts.error", "Error"), t("errors.unexpected"));
      } finally {
        setIsSavingFullPack(false);
      }
    } else {
      setIsSavingFullPack(true);
      try {
        const packRoutines = userRoutines.filter((r) =>
          selectedPack.routineIds.includes(r.id),
        );
        const newLocalRoutineIds: string[] = [];

        for (const routine of packRoutines) {
          let localId = getSavedRoutineId(routine.id);

          if (!localId) {
            const myRoutinesRef = collection(
              db,
              "users",
              auth.currentUser.uid,
              "routines",
            );
            const newRoutineDoc = await addDoc(myRoutinesRef, {
              name: routine.name,
              exercises: routine.exercises,
              createdAt: Date.now(),
              originalCreatorId: profileId,
              originalCreatorName: username,
              originalRoutineId: routine.id,
            });
            localId = newRoutineDoc.id;
          }
          newLocalRoutineIds.push(localId);
        }

        await saveWeeklyPack(
          selectedPack.name,
          selectedPack.description,
          newLocalRoutineIds,
          profileId,
          username,
          selectedPack.id,
        );

        Alert.alert(
          t("profile.alerts.success", "Éxito"),
          t(
            "weeklyPacks.successSaved",
            "¡Pack y rutinas guardados en tu perfil!",
          ),
        );
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("alerts.error", "Error"), t("errors.unexpected"));
      } finally {
        setIsSavingFullPack(false);
      }
    }
  };

  return {
    getSavedRoutineId,
    getSavedPackId,
    handleToggleSaveRoutine,
    handleToggleSavePack,
    isSavingFullPack,
  };
};

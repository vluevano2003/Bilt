import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { supabase } from "../src/config/supabase";
import { useAuth } from "../src/context/AuthContext";
import { useRoutines } from "./useRoutines";
import { useWeeklyPacks, WeeklyPack } from "./useWeeklyPacks";

/**
 * Custom hook para manejar las acciones de guardar y eliminar rutinas y packs en el perfil de un usuario
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
  const { user } = useAuth();
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
   * Maneja la lógica para guardar o eliminar una rutina individual en el perfil del usuario, verificando si está asociada a algún pack guardado
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
      if (!user?.id) return;

      try {
        const { error } = await supabase.from("routines").insert([
          {
            user_id: user.id,
            name: routineToToggle.name,
            exercises: routineToToggle.exercises,
            original_creator_id: profileId,
            original_creator_name: username,
            original_routine_id: routineToToggle.id,
          },
        ]);

        if (error) throw error;

        Alert.alert(t("profile.alerts.success"), t("routines.successSaved"));
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    }
  };

  /**
   * Maneja la lógica para guardar o eliminar un pack completo en el perfil del usuario, incluyendo las rutinas asociadas
   * @param selectedPack
   * @param onComplete
   * @returns
   */
  const handleToggleSavePack = async (
    selectedPack: WeeklyPack | null,
    onComplete?: () => void,
  ) => {
    if (!selectedPack || !user?.id) return;

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
          t("profile.alerts.success"),
          t("weeklyPacks.successRemoved"),
        );
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("alerts.error"), t("errors.unexpected"));
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
            const { data: newRoutine, error } = await supabase
              .from("routines")
              .insert([
                {
                  user_id: user.id,
                  name: routine.name,
                  exercises: routine.exercises || [],
                  original_creator_id: profileId,
                  original_creator_name: username,
                  original_routine_id: routine.id,
                },
              ])
              .select()
              .single();

            if (error) throw error;
            localId = newRoutine.id;
          }
          if (localId) newLocalRoutineIds.push(localId);
        }

        await saveWeeklyPack(
          selectedPack.name,
          selectedPack.description,
          newLocalRoutineIds,
          profileId,
          username,
          selectedPack.id,
        );

        Alert.alert(t("profile.alerts.success"), t("weeklyPacks.successSaved"));
        if (onComplete) onComplete();
      } catch (error) {
        Alert.alert(t("alerts.error"), t("errors.unexpected"));
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

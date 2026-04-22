import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import {
  ExerciseSet,
  ExerciseType,
  Routine,
  RoutineExercise,
} from "./useRoutines";

/**
 * Hook personalizado para manejar la lógica de edición de rutinas, incluyendo la gestión de ejercicios, sets y la interacción con el modal
 * @param saveRoutineFn
 * @param exercisesDb
 * @returns
 */
export const useRoutineEditor = (
  saveRoutineFn: (
    id: string | null,
    name: string,
    exercises: RoutineExercise[],
  ) => Promise<void>,
  exercisesDb: ExerciseType[],
) => {
  const { t } = useTranslation();

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

  /**
   * Abre el modal de edición de rutina. Si se proporciona una rutina, se carga para edición; de lo contrario, se prepara para crear una nueva rutina
   * @param routine
   */
  const openRoutineModal = (routine?: Routine) => {
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

  /**
   * Cierra el modal de edición de rutina y resetea el estado relacionado para evitar que datos anteriores persistan al abrir el modal para una nueva rutina
   */
  const closeRoutineModal = () => {
    setModalVisible(false);
    setEditingRoutine(null);
    setRoutineName("");
    setRoutineExercises([]);
  };

  /**
   * Maneja la lógica de guardado de la rutina, validando que el nombre no esté vacío y utilizando la función proporcionada para guardar los cambios. En caso de error, muestra una alerta al usuario
   * @returns
   */
  const handleSaveRoutine = async () => {
    if (!routineName.trim()) return;
    try {
      await saveRoutineFn(
        editingRoutine ? editingRoutine.id : null,
        routineName,
        routineExercises,
      );
      closeRoutineModal();
    } catch (error) {
      Alert.alert(t("alerts.error"), t("errors.unexpected"));
    }
  };

  /**
   * Elimina un ejercicio de la rutina basado en su ID, actualizando el estado de los ejercicios de la rutina para reflejar el cambio
   * @param exerciseId
   */
  const removeExercise = (exerciseId: string) => {
    setRoutineExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  /**
   * Reordena los ejercicios de la rutina según el nuevo orden proporcionado, actualizando el estado de los ejercicios de la rutina para reflejar el nuevo orden
   * @param newExercises
   */
  const reorderExercises = (newExercises: RoutineExercise[]) => {
    setRoutineExercises(newExercises);
  };

  /**
   * Agrega un nuevo set a un ejercicio específico de la rutina, identificando el ejercicio por su ID y actualizando el estado de los ejercicios de la rutina para incluir el nuevo set
   * @param routineExId
   */
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

  /**
   * Elimina un set específico de un ejercicio de la rutina, identificando el ejercicio y el set por sus IDs y actualizando el estado de los ejercicios de la rutina para reflejar la eliminación del set
   * @param routineExId
   * @param setId
   */
  const removeSetFromExercise = (routineExId: string, setId: string) => {
    setRoutineExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === routineExId) {
          return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
        }
        return ex;
      }),
    );
  };

  /**
   * Abre el modal de selección de ejercicios, reseteando los filtros y selecciones temporales para una nueva búsqueda
   */
  const openExerciseSelector = () => {
    setSearchQuery("");
    setSelectedMuscle(null);
    setTempSelectedExercises([]);
    setExerciseModalVisible(true);
  };

  /**
   * Agrega o elimina un ejercicio de la selección temporal basada en si ya está seleccionado o no, permitiendo al usuario seleccionar múltiples ejercicios antes de confirmar su adición a la rutina
   * @param exercise
   */
  const toggleExerciseSelection = (exercise: ExerciseType) => {
    setTempSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === exercise.id);
      if (exists) return prev.filter((e) => e.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  /**
   * Confirma la selección de ejercicios, creando nuevas entradas de ejercicios de rutina basadas en los ejercicios seleccionados temporalmente y agregándolos a la rutina actual, luego cierra el modal de selección de ejercicios
   */
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

  /**
   * Filtra la base de datos de ejercicios según el término de búsqueda y el grupo muscular seleccionado, devolviendo solo los ejercicios que coinciden con ambos criterios para mostrar en el modal de selección de ejercicios
   */
  const filteredExercises = useMemo(() => {
    return exercisesDb.filter((ex) => {
      const exerciseName = t(`exercises.${ex.id}`).toLowerCase();
      const matchesSearch = exerciseName.includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle
        ? ex.muscleGroup === selectedMuscle
        : true;
      return matchesSearch && matchesMuscle;
    });
  }, [searchQuery, selectedMuscle, t, exercisesDb]);

  /**
   * Calcula la lista de grupos musculares únicos presentes en la base de datos de ejercicios, utilizando useMemo para evitar cálculos innecesarios en cada renderizado, lo que permite mostrar opciones de filtrado por grupo muscular en el modal de selección de ejercicios
   */
  const uniqueMuscles = useMemo(() => {
    const muscles = exercisesDb.map((ex) => ex.muscleGroup);
    return [...new Set(muscles)];
  }, [exercisesDb]);

  return {
    modalVisible,
    editingRoutine,
    routineName,
    setRoutineName,
    routineExercises,
    openRoutineModal,
    closeRoutineModal,
    handleSaveRoutine,
    removeExercise,
    reorderExercises,
    addSetToExercise,
    removeSetFromExercise,
    exerciseModalVisible,
    setExerciseModalVisible,
    searchQuery,
    setSearchQuery,
    selectedMuscle,
    setSelectedMuscle,
    tempSelectedExercises,
    openExerciseSelector,
    toggleExerciseSelection,
    confirmSelectedExercises,
    filteredExercises,
    uniqueMuscles,
  };
};

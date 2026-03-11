import { AntDesign, Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";

import {
    ExerciseSet,
    Routine,
    WeightUnit,
    useRoutines,
} from "../hooks/useRoutines";
import { colors } from "../src/constants/theme";

export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { routineId } = useLocalSearchParams();
  const { routines } = useRoutines();

  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(
    null,
  );
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    if (routines.length > 0 && routineId) {
      const template = routines.find((r) => r.id === routineId);
      if (template) {
        setActiveRoutine(JSON.parse(JSON.stringify(template)));
      }
    }
  }, [routines, routineId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeRoutine && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, isPaused]);

  const playTimerEndSound = async () => {
    try {
      Vibration.vibrate(500);
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/beep.mp3"),
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log(
        "No se pudo cargar el sonido. Verifica que assets/beep.mp3 exista.",
        error,
      );
    }
  };

  // Cronómetro de Descanso
  useEffect(() => {
    let restInterval: ReturnType<typeof setInterval>;
    if (
      isResting &&
      restTimeRemaining !== null &&
      restTimeRemaining > 0 &&
      !isPaused
    ) {
      restInterval = setInterval(() => {
        setRestTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (restTimeRemaining === 0) {
      setIsResting(false);
      setRestTimeRemaining(null);
      playTimerEndSound();
    }
    return () => clearInterval(restInterval);
  }, [isResting, restTimeRemaining, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => {
    if (!activeRoutine) return;
    const numValue = value === "" ? 0 : Number(value.replace(/[^0-9.]/g, ""));
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) =>
          s.id === setId ? { ...s, [field]: numValue } : s,
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const toggleUnit = (exerciseId: string, setId: string) => {
    if (!activeRoutine) return;
    const units: WeightUnit[] = ["kg", "lbs", "bars", "plates", "bodyweight"];
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            const currentIndex = units.indexOf(s.weightUnit);
            const nextIndex = (currentIndex + 1) % units.length;
            return { ...s, weightUnit: units[nextIndex] };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: Math.random().toString(36).substr(2, 9),
          type: "normal",
          reps: lastSet ? lastSet.reps : 0,
          weight: lastSet ? lastSet.weight : 0,
          weightUnit: lastSet ? lastSet.weightUnit : "kg",
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    if (!activeRoutine) return;
    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const toggleSetCompletion = (
    exerciseId: string,
    setId: string,
    defaultRestSeconds: number,
  ) => {
    if (!activeRoutine) return;

    let isMarkingAsComplete = false;

    const updatedExercises = activeRoutine.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            isMarkingAsComplete = !s.completed;
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });

    if (isMarkingAsComplete && !isResting) {
      setRestTimeRemaining(defaultRestSeconds);
      setIsResting(true);
    }
  };

  const adjustRestTime = (secondsToAdd: number) => {
    setRestTimeRemaining((prev) => {
      if (prev === null) return null;
      const newTime = prev + secondsToAdd;
      return newTime > 0 ? newTime : 0;
    });
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestTimeRemaining(null);
  };

  const handleFinishWorkout = () => {
    setIsPaused(true);
    Alert.alert(
      t("activeWorkout.finishAlertTitle"),
      t("activeWorkout.finishAlertMsg"),
      [
        {
          text: t("common.back"),
          style: "cancel",
          onPress: () => setIsPaused(false),
        },
        {
          text: t("activeWorkout.yesFinish"),
          style: "default",
          onPress: () => {
            console.log("Rutina Finalizada:", activeRoutine);
            router.back();
          },
        },
      ],
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      t("activeWorkout.cancelAlertTitle"),
      t("activeWorkout.cancelAlertMsg"),
      [
        { text: t("common.back"), style: "cancel" },
        {
          text: t("activeWorkout.yesCancel"),
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  if (!activeRoutine) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelWorkout}>
          <AntDesign name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <TouchableOpacity onPress={handleFinishWorkout}>
          <Text style={styles.finishText}>{t("activeWorkout.finish")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.routineTitle}>
        {t("activeWorkout.workoutOf", { name: activeRoutine.name })}
      </Text>

      {isResting && restTimeRemaining !== null && (
        <View style={styles.restBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restBannerTitle}>
              {t("activeWorkout.restTimer", "Tiempo de Descanso")}
            </Text>
            <Text style={styles.restBannerTime}>
              {formatRestTime(restTimeRemaining)}
            </Text>
          </View>

          <View style={styles.restControls}>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => adjustRestTime(-15)}
            >
              <Text style={styles.restAdjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => adjustRestTime(15)}
            >
              <Text style={styles.restAdjustText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restSkipBtn}
              onPress={stopRestTimer}
            >
              <Text style={styles.restSkipText}>
                {t("activeWorkout.skip", "Saltar")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={activeRoutine.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: exercise, index }) => (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>
              {index + 1}. {exercise.exerciseDetails.name}
            </Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>
                {t("activeWorkout.set")}
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { flex: 1.2, textAlign: "center" },
                ]}
              >
                {t("activeWorkout.weight")}
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                {t("activeWorkout.reps")}
              </Text>
              <View style={{ flex: 0.5 }} />
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View
                key={set.id}
                style={[styles.setRow, set.completed && styles.setRowCompleted]}
              >
                <View
                  style={{
                    flex: 0.5,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {!set.completed && (
                    <TouchableOpacity
                      onPress={() => removeSetFromExercise(exercise.id, set.id)}
                      style={{ marginRight: 6 }}
                    >
                      <Feather name="minus-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.setText}>{setIndex + 1}</Text>
                </View>

                <View
                  style={{
                    flex: 1.2,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      set.completed && styles.inputDisabled,
                    ]}
                    keyboardType="numeric"
                    value={set.weight ? set.weight.toString() : ""}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(val) =>
                      handleSetChange(exercise.id, set.id, "weight", val)
                    }
                    editable={!set.completed}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={[
                      styles.unitBadge,
                      set.completed && { opacity: 0.5 },
                    ]}
                    onPress={() => toggleUnit(exercise.id, set.id)}
                    disabled={set.completed}
                  >
                    <Text style={styles.unitText}>
                      {t(`activeWorkout.units.${set.weightUnit}`)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <TextInput
                    style={[
                      styles.input,
                      set.completed && styles.inputDisabled,
                    ]}
                    keyboardType="numeric"
                    value={set.reps ? set.reps.toString() : ""}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={(val) =>
                      handleSetChange(exercise.id, set.id, "reps", val)
                    }
                    editable={!set.completed}
                    selectTextOnFocus
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    set.completed
                      ? styles.checkButtonActive
                      : styles.checkButtonInactive,
                  ]}
                  onPress={() =>
                    toggleSetCompletion(
                      exercise.id,
                      set.id,
                      exercise.restTimeSeconds || 90,
                    )
                  }
                >
                  <Feather
                    name="check"
                    size={16}
                    color={set.completed ? "#FFF" : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => addSetToExercise(exercise.id)}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={styles.addSetText}>{t("activeWorkout.addSet")}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  finishText: { color: colors.primary, fontWeight: "bold", fontSize: 16 },
  routineTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  restBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: colors.primary,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  restBannerTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  restBannerTime: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  restControls: { flexDirection: "row", gap: 10, alignItems: "center" },
  restAdjustBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restAdjustText: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
  restSkipBtn: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  restSkipText: { color: colors.background, fontWeight: "bold", fontSize: 14 },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseName: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  tableHeader: { flexDirection: "row", marginBottom: 10, paddingHorizontal: 5 },
  tableHeaderText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 5,
  },
  setRowCompleted: { backgroundColor: "rgba(34, 197, 94, 0.1)" },
  setText: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 45,
    textAlign: "center",
    fontWeight: "bold",
  },
  inputDisabled: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: colors.textPrimary,
  },
  unitBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  unitText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flex: 0.5,
  },
  checkButtonInactive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkButtonActive: { backgroundColor: "#22C55E" },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  addSetText: { color: colors.primary, fontWeight: "bold", marginLeft: 5 },
});

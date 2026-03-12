import { ExerciseType } from "../../hooks/useRoutines";

export const EXERCISE_DATABASE: ExerciseType[] = [
  // PECHO
  { id: "bench_press_barbell", muscleGroup: "chest", equipment: "free_weight" },
  {
    id: "bench_press_dumbbell",
    muscleGroup: "chest",
    equipment: "free_weight",
  },
  {
    id: "incline_bench_press_barbell",
    muscleGroup: "chest",
    equipment: "free_weight",
  },
  {
    id: "incline_bench_press_dumbbell",
    muscleGroup: "chest",
    equipment: "free_weight",
  },
  {
    id: "decline_bench_press_barbell",
    muscleGroup: "chest",
    equipment: "free_weight",
  },
  {
    id: "decline_bench_press_dumbbell",
    muscleGroup: "chest",
    equipment: "free_weight",
  },
  { id: "chest_press_machine", muscleGroup: "chest", equipment: "machine" },
  {
    id: "incline_chest_press_machine",
    muscleGroup: "chest",
    equipment: "machine",
  },
  { id: "chest_fly_dumbbell", muscleGroup: "chest", equipment: "free_weight" },
  { id: "pec_deck", muscleGroup: "chest", equipment: "machine" },
  { id: "cable_crossover", muscleGroup: "chest", equipment: "cable" },
  { id: "pushups", muscleGroup: "chest", equipment: "bodyweight" },
  { id: "dips_chest", muscleGroup: "chest", equipment: "bodyweight" },
  { id: "pullover_dumbbell", muscleGroup: "chest", equipment: "free_weight" },

  // ESPALDA
  { id: "pullups", muscleGroup: "back", equipment: "bodyweight" },
  { id: "chinups", muscleGroup: "back", equipment: "bodyweight" },
  { id: "lat_pulldown_wide", muscleGroup: "back", equipment: "cable" },
  { id: "lat_pulldown_close", muscleGroup: "back", equipment: "cable" },
  { id: "barbell_row", muscleGroup: "back", equipment: "free_weight" },
  { id: "dumbbell_row", muscleGroup: "back", equipment: "free_weight" },
  { id: "seated_cable_row", muscleGroup: "back", equipment: "cable" },
  { id: "machine_row", muscleGroup: "back", equipment: "machine" },
  { id: "t_bar_row", muscleGroup: "back", equipment: "free_weight" },
  { id: "t_bar_row_machine", muscleGroup: "back", equipment: "machine" },
  { id: "deadlift", muscleGroup: "back", equipment: "free_weight" },
  { id: "straight_arm_pulldown", muscleGroup: "back", equipment: "cable" },
  { id: "hyperextensions", muscleGroup: "back", equipment: "bodyweight" },
  { id: "shrugs_barbell", muscleGroup: "back", equipment: "free_weight" },
  { id: "shrugs_dumbbell", muscleGroup: "back", equipment: "free_weight" },

  // PIERNAS
  { id: "squat_barbell", muscleGroup: "legs", equipment: "free_weight" },
  { id: "squat_dumbbell", muscleGroup: "legs", equipment: "free_weight" },
  { id: "front_squat_barbell", muscleGroup: "legs", equipment: "free_weight" },
  { id: "hack_squat_machine", muscleGroup: "legs", equipment: "machine" },
  { id: "leg_press", muscleGroup: "legs", equipment: "machine" },
  { id: "leg_extension", muscleGroup: "legs", equipment: "machine" },
  { id: "leg_curl_lying", muscleGroup: "legs", equipment: "machine" },
  { id: "leg_curl_seated", muscleGroup: "legs", equipment: "machine" },
  {
    id: "romanian_deadlift_barbell",
    muscleGroup: "legs",
    equipment: "free_weight",
  },
  {
    id: "romanian_deadlift_dumbbell",
    muscleGroup: "legs",
    equipment: "free_weight",
  },
  { id: "lunges_barbell", muscleGroup: "legs", equipment: "free_weight" },
  { id: "lunges_dumbbell", muscleGroup: "legs", equipment: "free_weight" },
  {
    id: "bulgarian_split_squat_dumbbell",
    muscleGroup: "legs",
    equipment: "free_weight",
  },
  { id: "hip_thrust_barbell", muscleGroup: "legs", equipment: "free_weight" },
  { id: "hip_thrust_machine", muscleGroup: "legs", equipment: "machine" },
  { id: "calf_raise_standing", muscleGroup: "legs", equipment: "machine" },
  { id: "calf_raise_seated", muscleGroup: "legs", equipment: "machine" },

  // HOMBROS
  {
    id: "overhead_press_barbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  {
    id: "overhead_press_dumbbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  {
    id: "shoulder_press_machine",
    muscleGroup: "shoulders",
    equipment: "machine",
  },
  { id: "arnold_press", muscleGroup: "shoulders", equipment: "free_weight" },
  {
    id: "lateral_raises_dumbbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  { id: "lateral_raises_cable", muscleGroup: "shoulders", equipment: "cable" },
  {
    id: "front_raises_dumbbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  {
    id: "front_raises_barbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  { id: "face_pull", muscleGroup: "shoulders", equipment: "cable" },
  { id: "reverse_pec_deck", muscleGroup: "shoulders", equipment: "machine" },
  {
    id: "upright_row_barbell",
    muscleGroup: "shoulders",
    equipment: "free_weight",
  },
  { id: "upright_row_cable", muscleGroup: "shoulders", equipment: "cable" },

  // BRAZOS (BÍCEPS)
  { id: "bicep_curl_barbell", muscleGroup: "arms", equipment: "free_weight" },
  { id: "bicep_curl_dumbbell", muscleGroup: "arms", equipment: "free_weight" },
  { id: "hammer_curl_dumbbell", muscleGroup: "arms", equipment: "free_weight" },
  { id: "hammer_curl_cable", muscleGroup: "arms", equipment: "cable" },
  {
    id: "preacher_curl_barbell",
    muscleGroup: "arms",
    equipment: "free_weight",
  },
  { id: "preacher_curl_machine", muscleGroup: "arms", equipment: "machine" },
  { id: "bicep_curl_cable", muscleGroup: "arms", equipment: "cable" },
  {
    id: "concentration_curl_dumbbell",
    muscleGroup: "arms",
    equipment: "free_weight",
  },

  // BRAZOS (TRÍCEPS)
  { id: "tricep_pushdown_cable", muscleGroup: "arms", equipment: "cable" },
  {
    id: "overhead_tricep_extension_dumbbell",
    muscleGroup: "arms",
    equipment: "free_weight",
  },
  {
    id: "overhead_tricep_extension_cable",
    muscleGroup: "arms",
    equipment: "cable",
  },
  { id: "skullcrusher_barbell", muscleGroup: "arms", equipment: "free_weight" },
  { id: "dips_triceps", muscleGroup: "arms", equipment: "bodyweight" },
  {
    id: "close_grip_bench_press",
    muscleGroup: "arms",
    equipment: "free_weight",
  },
  {
    id: "tricep_kickback_dumbbell",
    muscleGroup: "arms",
    equipment: "free_weight",
  },
  { id: "tricep_kickback_cable", muscleGroup: "arms", equipment: "cable" },

  // CORE
  { id: "crunch", muscleGroup: "core", equipment: "bodyweight" },
  { id: "plank", muscleGroup: "core", equipment: "bodyweight" },
  { id: "russian_twist", muscleGroup: "core", equipment: "free_weight" },
  { id: "leg_raises_lying", muscleGroup: "core", equipment: "bodyweight" },
  { id: "leg_raises_hanging", muscleGroup: "core", equipment: "bodyweight" },
  { id: "ab_wheel_rollout", muscleGroup: "core", equipment: "free_weight" },
  { id: "bicycle_crunch", muscleGroup: "core", equipment: "bodyweight" },
  { id: "cable_crunch", muscleGroup: "core", equipment: "cable" },
];

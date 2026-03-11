// src/constants/exercises.ts
import { ExerciseType } from "../../hooks/useRoutines";

export const EXERCISE_DATABASE: ExerciseType[] = [
  // PECHO
  {
    id: "bench_press",
    name: "Press de Banca",
    targetMuscle: "Pecho",
    equipment: "free_weight",
  },
  {
    id: "incline_db_press",
    name: "Press Inclinado con Mancuernas",
    targetMuscle: "Pecho",
    equipment: "free_weight",
  },
  {
    id: "pec_deck",
    name: "Pec Deck (Máquina)",
    targetMuscle: "Pecho",
    equipment: "machine",
  },
  {
    id: "pushups",
    name: "Flexiones",
    targetMuscle: "Pecho",
    equipment: "bodyweight",
  },
  {
    id: "cable_crossover",
    name: "Cruces en Polea",
    targetMuscle: "Pecho",
    equipment: "cable",
  },

  // ESPALDA
  {
    id: "pullups",
    name: "Dominadas",
    targetMuscle: "Espalda",
    equipment: "bodyweight",
  },
  {
    id: "lat_pulldown",
    name: "Jalón al Pecho",
    targetMuscle: "Espalda",
    equipment: "cable",
  },
  {
    id: "barbell_row",
    name: "Remo con Barra",
    targetMuscle: "Espalda",
    equipment: "free_weight",
  },
  {
    id: "seated_cable_row",
    name: "Remo en Polea Baja",
    targetMuscle: "Espalda",
    equipment: "cable",
  },

  // PIERNAS
  {
    id: "squat",
    name: "Sentadilla Libre",
    targetMuscle: "Piernas",
    equipment: "free_weight",
  },
  {
    id: "leg_press",
    name: "Prensa de Piernas",
    targetMuscle: "Piernas",
    equipment: "machine",
  },
  {
    id: "leg_extension",
    name: "Extensión de Cuádriceps",
    targetMuscle: "Piernas",
    equipment: "machine",
  },
  {
    id: "leg_curl",
    name: "Curl de Isquiotibiales",
    targetMuscle: "Piernas",
    equipment: "machine",
  },
  {
    id: "calf_raise",
    name: "Elevación de Gemelos",
    targetMuscle: "Piernas",
    equipment: "machine",
  },

  // HOMBROS
  {
    id: "overhead_press",
    name: "Press Militar",
    targetMuscle: "Hombros",
    equipment: "free_weight",
  },
  {
    id: "lateral_raises",
    name: "Elevaciones Laterales",
    targetMuscle: "Hombros",
    equipment: "free_weight",
  },
  {
    id: "face_pull",
    name: "Face Pull",
    targetMuscle: "Hombros",
    equipment: "cable",
  },

  // BRAZOS
  {
    id: "bicep_curl",
    name: "Curl de Bíceps con Barra",
    targetMuscle: "Brazos",
    equipment: "free_weight",
  },
  {
    id: "hammer_curl",
    name: "Curl Martillo",
    targetMuscle: "Brazos",
    equipment: "free_weight",
  },
  {
    id: "tricep_pushdown",
    name: "Extensión de Tríceps en Polea",
    targetMuscle: "Brazos",
    equipment: "cable",
  },
  {
    id: "skullcrusher",
    name: "Rompecráneos",
    targetMuscle: "Brazos",
    equipment: "free_weight",
  },

  // CORE
  {
    id: "crunch",
    name: "Crunch Abdominal",
    targetMuscle: "Core",
    equipment: "bodyweight",
  },
  {
    id: "plank",
    name: "Plancha",
    targetMuscle: "Core",
    equipment: "bodyweight",
  },
];

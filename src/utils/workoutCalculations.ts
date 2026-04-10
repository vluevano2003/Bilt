/**
 * Convierte el peso dado a la unidad correspondiente según el sistema de medición
 */
export const getConvertedWeight = (
  itemWeight: number | string,
  unit: string,
  system: "metric" | "imperial" | string,
  userWeight: number | string = 0,
) => {
  if (unit === "bars" || unit === "plates") return 0;

  let w = Number(itemWeight) || 0;
  const uW = Number(userWeight) || 0;

  if (unit === "bodyweight") {
    w += uW;
  } else {
    if (system === "metric" && unit === "lbs") w = w * 0.453592;
    if (system === "imperial" && unit === "kg") w = w * 2.20462;
  }
  return w;
};

export const calculateTotalVolume = (
  userHistory: any[],
  measurementSystem: string,
) => {
  let total = 0;
  userHistory?.forEach((session: any) => {
    session.exercises?.forEach((ex: any) => {
      ex.sets?.forEach((set: any) => {
        if (set.completed) {
          const w = getConvertedWeight(
            set.weight,
            set.weightUnit,
            measurementSystem,
          );
          total += w * (Number(set.reps) || 0);
        }
      });
    });
  });
  return Math.round(total);
};

/**
 * Calcula el volumen total de una sesión específica, sumando el peso levantado en cada set completado
 * @param session
 * @param measurementSystem
 * @returns
 */
export const calculateSessionVolume = (
  session: any,
  system: "metric" | "imperial" | string,
  userWeight: number | string = 0,
) => {
  let totalVolume = 0;
  if (!session?.exercises) return 0;

  session.exercises.forEach((ex: any) => {
    ex.sets?.forEach((set: any) => {
      if (set.completed) {
        const w = getConvertedWeight(
          set.weight,
          set.weightUnit,
          system,
          userWeight,
        );
        totalVolume += w * (set.reps || 0);
      }
    });
  });
  return Math.round(totalVolume);
};

/**
 * Convierte la duración dada en segundos a minutos, redondeando hacia arriba
 * @param seconds
 * @returns
 */
export const formatDuration = (seconds: number) => {
  if (!seconds) return 0;
  return Math.ceil(seconds / 60);
};

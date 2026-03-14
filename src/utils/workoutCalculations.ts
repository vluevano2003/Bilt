/**
 * Convierte el peso dado a la unidad correspondiente según el sistema de medición
 */
export const getConvertedWeight = (
  itemWeight: number | string,
  unit: string,
  measurementSystem: string,
) => {
  const w = Number(itemWeight) || 0;
  if (measurementSystem === "metric" && unit === "lbs") return w * 0.453592;
  if (measurementSystem === "imperial" && unit === "kg") return w * 2.20462;
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
  measurementSystem: string,
) => {
  if (!session?.exercises) return 0;
  let total = 0;
  session.exercises.forEach((ex: any) => {
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
  return Math.round(total);
};

/**
 * Convierte la duración dada en segundos a minutos, redondeando hacia arriba
 * @param seconds
 * @returns
 */
export const formatDuration = (seconds: number) => {
  const s = Number(seconds) || 0;
  return Math.ceil(s / 60);
};

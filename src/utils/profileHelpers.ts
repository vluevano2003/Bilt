export const getConvertedProfileWeight = (
  w: string | number,
  system: string,
) => {
  let numW = Number(w) || 0;
  return system === "imperial" ? Math.round(numW * 2.20462) : Math.round(numW);
};

export const getConvertedProfileHeight = (
  h: string | number,
  system: string,
) => {
  let numH = Number(h) || 0;
  return system === "imperial" ? Math.round(numH / 2.54) : Math.round(numH);
};

export const getConvertedWeight = (
  itemWeight: number,
  unit: string,
  system: string,
) => {
  const w = Number(itemWeight) || 0;
  if (system === "metric" && unit === "lbs") return w * 0.453592;
  if (system === "imperial" && unit === "kg") return w * 2.20462;
  return w;
};

export const calculateTotalVolume = (session: any, system: string) => {
  if (!session?.exercises) return 0;
  let total = 0;
  session.exercises.forEach((ex: any) => {
    ex.sets?.forEach((set: any) => {
      if (set.completed) {
        const w = getConvertedWeight(set.weight, set.weightUnit, system);
        total += w * (Number(set.reps) || 0);
      }
    });
  });
  return Math.round(total);
};

export const formatDuration = (seconds: number) => {
  return Math.ceil((Number(seconds) || 0) / 60);
};

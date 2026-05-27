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

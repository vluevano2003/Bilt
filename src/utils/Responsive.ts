import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Tamaño relativo a la pantalla, basado en un diseño de 375x812
 * @param size
 * @returns
 */
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Tamaño relativo a la pantalla, basado en un diseño de 375x812
 * @param size
 * @returns
 */
export const verticalScale = (size: number) =>
  (height / guidelineBaseHeight) * size;

/**
 * Tamaño relativo a la pantalla, basado en un diseño de 375x812, pero con un factor de ajuste para controlar la cantidad de escalado
 * @param size
 * @param factor
 * @returns
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

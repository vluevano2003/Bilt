import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";
import { ClayCard } from "./ClayCard";

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Componente de botón secundario que se adapta al tema actual. Permite personalizar el estilo y deshabilitar el botón.
 * @param param0
 * @returns
 */
export const SecondaryButton = ({
  title,
  onPress,
  style,
  disabled,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <ClayCard
      style={[styles.buttonSecondary, style, disabled && { opacity: 0.6 }]}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={styles.buttonTextSecondary}>{title}</Text>
    </ClayCard>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    buttonSecondary: {
      padding: verticalScale(15),
      alignItems: "center",
      marginTop: verticalScale(10),
    },
    buttonTextSecondary: {
      color: colors.primary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
  });

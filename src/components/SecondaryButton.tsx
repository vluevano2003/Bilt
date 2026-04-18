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

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const SecondaryButton = ({
  title,
  onPress,
  style,
  disabled,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.buttonSecondary, style, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonTextSecondary}>{title}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    buttonSecondary: {
      backgroundColor: "transparent",
      padding: verticalScale(15),
      borderRadius: scale(10),
      alignItems: "center",
      marginTop: verticalScale(10),
      borderWidth: 1,
      borderColor: colors.primary,
    },
    buttonTextSecondary: {
      color: colors.primary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
  });

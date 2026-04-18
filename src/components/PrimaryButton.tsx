import React from "react";
import {
  ActivityIndicator,
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
  loading?: boolean;
}

export const PrimaryButton = ({
  title,
  onPress,
  style,
  disabled,
  loading,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.buttonPrimary, style, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={styles.buttonTextPrimary}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    buttonPrimary: {
      backgroundColor: colors.primary,
      padding: verticalScale(15),
      borderRadius: scale(10),
      alignItems: "center",
      marginTop: verticalScale(10),
    },
    buttonTextPrimary: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
  });

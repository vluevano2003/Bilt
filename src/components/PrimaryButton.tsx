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
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
    },
    buttonTextPrimary: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "bold",
    },
  });

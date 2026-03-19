import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CustomInputProps extends TextInputProps {
  style?: any;
}

export const CustomInput = ({ style, ...props }: CustomInputProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    input: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
    },
  });

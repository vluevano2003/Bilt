import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors } from "../constants/theme";

interface CustomInputProps extends TextInputProps {
  style?: any;
}

export const CustomInput = ({ style, ...props }: CustomInputProps) => (
  <TextInput
    style={[styles.input, style]}
    placeholderTextColor={colors.textSecondary}
    {...props}
  />
);

const styles = StyleSheet.create({
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

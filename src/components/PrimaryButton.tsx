import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { colors } from "../constants/theme";

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
}: ButtonProps) => (
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

const styles = StyleSheet.create({
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

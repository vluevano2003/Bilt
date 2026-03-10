import React from "react";
import {
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
}

export const SecondaryButton = ({
  title,
  onPress,
  style,
  disabled,
}: ButtonProps) => (
  <TouchableOpacity
    style={[styles.buttonSecondary, style, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.buttonTextSecondary}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  buttonSecondary: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
});

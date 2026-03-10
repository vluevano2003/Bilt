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
}

export const SecondaryButton = ({ title, onPress, style }: ButtonProps) => (
  <TouchableOpacity style={[styles.buttonSecondary, style]} onPress={onPress}>
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

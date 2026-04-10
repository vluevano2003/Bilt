import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CustomInputProps extends TextInputProps {
  style?: any;
  containerStyle?: any;
  isPassword?: boolean;
}

export const CustomInput = ({
  style,
  containerStyle,
  isPassword,
  ...props
}: CustomInputProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return isPassword ? (
    <View style={[styles.passwordContainer, containerStyle]}>
      <TextInput
        style={[styles.input, style, { paddingRight: 45, marginBottom: 0 }]}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={!isPasswordVisible}
        {...props}
      />
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
      >
        <Feather
          name={isPasswordVisible ? "eye" : "eye-off"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  ) : (
    <TextInput
      style={[styles.input, style, containerStyle]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    passwordContainer: {
      width: "100%",
      marginBottom: 15,
      position: "relative",
      justifyContent: "center",
    },
    input: {
      width: "100%",
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: 10,
      padding: 15,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 15,
    },
    iconContainer: {
      position: "absolute",
      right: 15,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
  });

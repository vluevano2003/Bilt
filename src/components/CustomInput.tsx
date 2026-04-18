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
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

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
        style={[
          styles.input,
          style,
          { paddingRight: scale(45), marginBottom: 0 },
        ]}
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
          size={scale(20)}
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
      marginBottom: verticalScale(15),
      position: "relative",
      justifyContent: "center",
    },
    input: {
      width: "100%",
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: scale(10),
      padding: scale(15),
      fontSize: moderateScale(14),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: verticalScale(15),
    },
    iconContainer: {
      position: "absolute",
      right: scale(15),
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
  });

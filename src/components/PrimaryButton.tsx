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
import { ClayCard } from "./ClayCard";

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Componente de botón primario que se adapta al tema actual. Muestra un indicador de carga cuando `loading` es verdadero y deshabilita el botón cuando `disabled` es verdadero o `loading` es verdadero.
 * @param param0
 * @returns
 */
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
    <ClayCard
      color={colors.primary}
      style={[styles.buttonPrimary, style, disabled && { opacity: 0.6 }]}
      onPress={disabled || loading ? undefined : onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.buttonTextPrimary}>{title}</Text>
      )}
    </ClayCard>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    buttonPrimary: {
      padding: verticalScale(15),
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(10),
    },
    buttonTextPrimary: {
      color: "#FFF",
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
  });

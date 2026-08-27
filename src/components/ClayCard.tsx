import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../utils/Responsive';

interface ClayCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  onPress?: () => void;
  activeOpacity?: number;
}

/**
 * Componente contenedor que aplica un estilo "Claymorfismo" (3D inflado)
 * mediante el uso de bordes direccionales (luces y sombras internas) y
 * una sombra exterior suave.
 */
export const ClayCard: React.FC<ClayCardProps> = ({ children, style, color, onPress, activeOpacity = 0.8 }) => {
  const { colors, isDarkMode } = useTheme();

  const surfaceColor = color || colors.surface;

  // Luces (top/left) y Sombras interiores (bottom/right) simuladas con bordes
  const lightShadow = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)';
  const darkShadow = isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.12)';
  const outerShadow = isDarkMode ? '#000000' : '#777777';

  const cardStyles = [
    styles.baseCard,
    {
      backgroundColor: surfaceColor,
      shadowColor: outerShadow,
      borderTopColor: lightShadow,
      borderLeftColor: lightShadow,
      borderBottomColor: darkShadow,
      borderRightColor: darkShadow,
    },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity} style={cardStyles}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

/**
 * Estilos base del componente ClayCard
 */
const styles = StyleSheet.create({
  baseCard: {
    borderRadius: scale(22),
    borderWidth: 2,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  }
});

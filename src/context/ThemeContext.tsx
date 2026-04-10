import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "../constants/theme";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof lightColors;
  toggleTheme: (value?: boolean) => void;
};

/**
 * Contexto para manejar el tema de la aplicación (claro/oscuro) y el idioma. Carga las preferencias guardadas al iniciar y las guarda al cambiar. Proporciona un toggle para cambiar el tema desde cualquier pantalla.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Componente proveedor del contexto de tema. Carga las preferencias de tema e idioma al montar, y proporciona funciones para cambiar el tema y el idioma, guardando las preferencias en AsyncStorage.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();

  const systemColorScheme = useColorScheme();

  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("appTheme");
        const savedLanguage = await AsyncStorage.getItem("appLanguage");

        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === "dark");
        } else {
          setIsDarkMode(systemColorScheme === "dark");
        }

        if (savedLanguage !== null) {
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        debugLog("Error loading settings", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, [systemColorScheme]);

  const toggleTheme = async (value?: boolean) => {
    const newMode = value !== undefined ? value : !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem("appTheme", newMode ? "dark" : "light");
    } catch (error) {
      debugLog("Error saving theme", error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de tema. Lanza un error si se usa fuera del ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  return context;
};

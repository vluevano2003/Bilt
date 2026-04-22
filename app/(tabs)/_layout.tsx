import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext";
import { moderateScale, verticalScale } from "../../src/utils/Responsive";

/**
 * Layout principal para las pestañas de navegación. Define la apariencia y el comportamiento de las pestañas.
 * @returns
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: verticalScale(60) + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : verticalScale(10),
          paddingTop: verticalScale(10),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontWeight: "900" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.workout"),
          tabBarIcon: ({ color }) => (
            <FontAwesome5
              name="dumbbell"
              size={moderateScale(24)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t("tabs.social"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="team" size={moderateScale(28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={moderateScale(28)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

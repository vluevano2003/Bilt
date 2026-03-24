import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontWeight: "900" },
      }}
    >
      {/*Home*/}
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.workout", "Entrenar"),
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="dumbbell" size={24} color={color} />
          ),
        }}
      />

      {/*Social*/}
      <Tabs.Screen
        name="social"
        options={{
          title: t("tabs.social"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="team" size={28} color={color} />
          ),
        }}
      />

      {/*Perfil*/}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

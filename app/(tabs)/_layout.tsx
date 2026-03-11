import { AntDesign } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "../../src/constants/theme";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontWeight: "900" },
      }}
    >
      {/*Pantalla Principal (Archivo: home.tsx)*/}
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" size={24} color={color} />
          ),
        }}
      />

      {/*Creador de Rutinas (Archivo: routines.tsx)*/}
      <Tabs.Screen
        name="routines"
        options={{
          title: t("tabs.routines"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="form" size={24} color={color} />
          ),
        }}
      />

      {/*Social (Archivo: social.tsx)*/}
      <Tabs.Screen
        name="social"
        options={{
          title: t("tabs.social"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="team" size={24} color={color} />
          ),
        }}
      />

      {/*Perfil de Usuario (Archivo: profile.tsx)*/}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

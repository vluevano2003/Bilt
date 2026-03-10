import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../src/config/i18n";
import { colors } from "../src/constants/theme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

/**
 * RootLayoutNav es el componente que maneja la navegación principal de la aplicación
 * @returns
 */
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Redirige al usuario según su estado de autenticación y la ruta actual
  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && inTabsGroup) {
      router.replace("/");
    } else if (user && !inTabsGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Renderiza las pantallas de la aplicación dentro del Stack Navigator
  return <Stack screenOptions={{ headerShown: false }} />;
}

// RootLayout es el componente raíz que envuelve toda la aplicación con el AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

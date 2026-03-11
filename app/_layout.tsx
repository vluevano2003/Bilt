import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../src/config/i18n";
import { colors } from "../src/constants/theme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inUserProfile = segments[0] === "userProfile";
    const inActiveWorkout = segments[0] === "activeWorkout";

    if (!user && (inTabsGroup || inUserProfile || inActiveWorkout)) {
      router.replace("/");
    } else if (user && !inTabsGroup && !inUserProfile && !inActiveWorkout) {
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="userProfile" options={{ presentation: "card" }} />
      <Stack.Screen
        name="activeWorkout"
        options={{ presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

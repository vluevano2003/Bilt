import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";
import { MiniWorkoutPlayer } from "../src/components/MiniWorkoutPlayer";
import "../src/config/i18n";
import { ActiveWorkoutProvider } from "../src/context/ActiveWorkoutContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

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
  useEffect(() => {
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log("¡AdMob Inicializado correctamente!");
      })
      .catch((error) => {
        console.error("Error inicializando AdMob:", error);
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ActiveWorkoutProvider>
            <RootLayoutNav />
            <MiniWorkoutPlayer />
          </ActiveWorkoutProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

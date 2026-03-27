import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";
import { MiniWorkoutPlayer } from "../src/components/MiniWorkoutPlayer";
import "../src/config/i18n";
import { ActiveWorkoutProvider } from "../src/context/ActiveWorkoutContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

function RootLayoutNav() {
  const { user, isLoading, hasProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

  const url = Linking.useURL();
  const [hasHandledInitialLink, setHasHandledInitialLink] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;

    const inTabsGroup = firstSegment === "(tabs)";
    const inUserProfile = firstSegment === "userProfile";
    const inActiveWorkout = firstSegment === "activeWorkout";

    const isProtectedScreen = inTabsGroup || inUserProfile || inActiveWorkout;

    const inIndex = !firstSegment || firstSegment === "index";

    if (!user && isProtectedScreen) {
      router.replace("/");
    } else if (user && !hasProfile && isProtectedScreen) {
      router.replace("/");
    } else if (user && hasProfile && inIndex) {
      if (url && !hasHandledInitialLink) {
        setHasHandledInitialLink(true);
        return;
      }
      router.replace("/(tabs)/home");
    }
  }, [user, isLoading, hasProfile, segments, url, hasHandledInitialLink]);

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

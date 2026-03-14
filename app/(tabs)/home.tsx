import { Feather } from "@expo/vector-icons";
import { Tabs, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SocialUser, useProfile } from "../../hooks/useProfile";
import { useUserActivity } from "../../hooks/useUserActivity";
import { NotificationModal } from "../../src/components/NotificationModal";
import { auth } from "../../src/config/firebase";
import { colors } from "../../src/constants/theme";
import { useActiveWorkout } from "../../src/context/ActiveWorkoutContext";
import { homeStyles as styles } from "../../src/styles/Home.styles";
import { calculateTotalVolume } from "../../src/utils/workoutCalculations";

/**
 * Menú principal del usuario, muestra un resumen de su actividad reciente, notificaciones y acceso rápido al workout activo
 * @returns
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    measurementSystem,
    isPrivate,
    pendingRequestsCount,
    getSocialList,
    handleFollowRequest,
  } = useProfile();
  const { userHistory, isLoadingActivity } = useUserActivity(
    auth.currentUser?.uid,
  );
  const { activeRoutine } = useActiveWorkout();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [requestsList, setRequestsList] = useState<SocialUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (params.openNotifications === "true") {
      openNotifications();
    }
  }, [params.openNotifications]);

  const displayUnit = measurementSystem === "metric" ? "kg" : "lbs";
  const totalWorkouts = userHistory?.length || 0;

  const openNotifications = async () => {
    setNotificationsVisible(true);
    setLoadingRequests(true);
    const users = await getSocialList("requests");
    setRequestsList(users);
    setLoadingRequests(false);
  };

  const onHandleRequest = (id: string, accept: boolean) => {
    handleFollowRequest(id, accept);
    setRequestsList((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={{
                paddingRight: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={openNotifications}
            >
              <Feather name="bell" size={24} color={colors.textPrimary} />
              {isPrivate && pendingRequestsCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: 14,
                    backgroundColor: "#EF4444",
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}
                  >
                    {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {/* Resumen semanal y acceso rápido al workout activo */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("home.title")}</Text>
        <Text style={styles.subtitle}>{t("home.subtitle")}</Text>

        <View style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Feather
              name="bar-chart-2"
              size={20}
              color={colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.cardTitle}>{t("home.weeklySummary")}</Text>
          </View>

          {isLoadingActivity ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalWorkouts}</Text>
                <Text style={styles.statLabel}>{t("home.workouts")}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {calculateTotalVolume(
                    userHistory,
                    measurementSystem,
                  ).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>
                  {t("home.volume", { unit: displayUnit })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {activeRoutine && (
          <TouchableOpacity
            style={[styles.actionButton, styles.activeWorkoutButton]}
            onPress={() => router.push("/activeWorkout")}
            activeOpacity={0.8}
          >
            <Feather
              name="play-circle"
              size={20}
              color={colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionButtonText}>{t("home.goToWorkout")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <NotificationModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        loading={loadingRequests}
        requestsList={requestsList}
        onHandleRequest={onHandleRequest}
      />
    </View>
  );
}

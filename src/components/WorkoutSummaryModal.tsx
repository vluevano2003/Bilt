import React from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { verticalScale } from "../utils/Responsive";

const { width, height } = Dimensions.get("window");

const COLORS = ["#FFC107", "#FF5252", "#4CAF50", "#2196F3", "#E040FB", "#00BCD4"];

const NativeCelebration = () => {
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: new Animated.Value(-20),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
      duration: Math.random() * 1500 + 1500,
      delay: Math.random() * 1000,
    }));
  }, []);

  const scale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    particles.forEach(p => {
      Animated.timing(p.y, {
        toValue: height + 50,
        duration: p.duration,
        delay: p.delay,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 999 }]} pointerEvents="none">
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.size / 2,
            transform: [{ translateY: p.y }],
            opacity: 0.8
          }}
        />
      ))}
    </View>
  );
};



/**
 * Modal que muestra un resumen del entrenamiento al finalizar, incluyendo duración, volumen total, series completadas y distribución muscular.
 * @param param0
 * @returns
 */
export const WorkoutSummaryModal = ({
  visible,
  insets,
  styles,
  t,
  elapsedSeconds,
  stats,
  volumeUnitText,
  formatTime,
  muscleDistribution,
  handleCloseSummary,
  isSavingHistory,
}: any) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={false}
    onRequestClose={() => {
      if (!isSavingHistory) {
        handleCloseSummary();
      }
    }}
  >
    <SafeAreaView style={styles.summaryOverlay}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + verticalScale(20),
          paddingBottom: verticalScale(160) + insets.bottom,
        }}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryHeaderTitle}>
            {t("activeWorkout.goodJob")}
          </Text>
          <Text style={styles.summaryHeaderSub}>
            {t("activeWorkout.workoutCompleted")}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryStatsRow,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
              },
            ]}
          >
            <View
              style={[
                styles.summaryStatCol,
                { flex: 1, alignItems: "flex-start" },
              ]}
            >
              <Text
                style={[styles.summaryStatLabel, { textAlign: "left" }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t("activeWorkout.duration")}
              </Text>
              <Text
                style={styles.summaryStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatTime(elapsedSeconds)}
              </Text>
            </View>

            <View
              style={[
                styles.summaryStatCol,
                { flex: 1, alignItems: "center", paddingHorizontal: 5 },
              ]}
            >
              <Text
                style={[styles.summaryStatLabel, { textAlign: "center" }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t("activeWorkout.totalVolume")}
              </Text>
              <Text
                style={styles.summaryStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stats.volume.toLocaleString()}{" "}
                <Text style={styles.summaryStatUnit}>{volumeUnitText}</Text>
              </Text>
            </View>

            <View
              style={[
                styles.summaryStatCol,
                { flex: 1, alignItems: "flex-end" },
              ]}
            >
              <Text
                style={[styles.summaryStatLabel, { textAlign: "right" }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t("activeWorkout.completedSets")}
              </Text>
              <Text
                style={styles.summaryStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stats.sets}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryMusclesTitle}>
            {t("activeWorkout.musclesWorked")}
          </Text>
          {muscleDistribution.length > 0 ? (
            muscleDistribution.map((muscle: any) => (
              <View key={muscle.name} style={styles.muscleRow}>
                <View style={styles.muscleHeader}>
                  <Text style={styles.muscleName}>
                    {t(`muscles.${muscle.name}`)}
                  </Text>
                  <Text style={styles.musclePercentage}>
                    {Math.round(muscle.percentage)}%
                  </Text>
                </View>
                <View style={styles.muscleBarBg}>
                  <View
                    style={[
                      styles.muscleBarFill,
                      { width: `${muscle.percentage}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noSetsValid}>
              {t("activeWorkout.noSetsValid")}
            </Text>
          )}
        </View>
      </ScrollView>
      <NativeCelebration />

      <View
        style={[
          styles.summaryFooter,
          {
            bottom: Math.max(
              verticalScale(35),
              insets.bottom + verticalScale(15),
            ),
          },
        ]}
      >
        <View style={styles.adWrapper}>
          <BannerAd
            unitId={
              __DEV__
                ? TestIds.BANNER
                : (process.env.EXPO_PUBLIC_ADMOB_BANNER_RESUMEN as string)
            }
            size={BannerAdSize.BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
        <TouchableOpacity
          style={styles.summaryFinishBtn}
          onPress={handleCloseSummary}
          disabled={isSavingHistory}
        >
          {isSavingHistory && (
            <ActivityIndicator color="#FFF" style={styles.summaryLoadingIcon} />
          )}
          <Text style={styles.summaryFinishBtnText}>
            {isSavingHistory
              ? t("common.saving")
              : t("activeWorkout.closeSummary")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

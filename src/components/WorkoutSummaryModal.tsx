import React from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { verticalScale } from "../utils/Responsive";

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
          paddingBottom: verticalScale(160) + insets.bottom,
        }}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryHeaderTitle}>
            {t("activeWorkout.goodJob", "¡Buen trabajo!")}
          </Text>
          <Text style={styles.summaryHeaderSub}>
            {t("activeWorkout.workoutCompleted", "Entrenamiento completado")}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatCol}>
              <Text style={styles.summaryStatLabel}>
                {t("activeWorkout.duration", "Duración")}
              </Text>
              <Text style={styles.summaryStatValue}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.summaryStatCol}>
              <Text style={styles.summaryStatLabel}>
                {t("activeWorkout.totalVolume", "Volumen")}
              </Text>
              <Text style={styles.summaryStatValue}>
                {stats.volume.toLocaleString()}{" "}
                <Text style={styles.summaryStatUnit}>{volumeUnitText}</Text>
              </Text>
            </View>
            <View style={styles.summaryStatCol}>
              <Text style={styles.summaryStatLabel}>
                {t("activeWorkout.completedSets", "Series")}
              </Text>
              <Text style={styles.summaryStatValue}>{stats.sets}</Text>
            </View>
          </View>

          <Text style={styles.summaryMusclesTitle}>
            {t("activeWorkout.musclesWorked", "Músculos trabajados")}
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
              {t(
                "activeWorkout.noSetsValid",
                "No completaste ninguna serie válida.",
              )}
            </Text>
          )}
        </View>
      </ScrollView>

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
              ? t("common.saving", "Guardando...")
              : t("common.finish", "Terminar")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

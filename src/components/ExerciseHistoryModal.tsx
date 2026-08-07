import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

interface Props {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  historyData: any;
}

export const ExerciseHistoryModal = ({ visible, onClose, exerciseName, historyData }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Determina la unidad base para la escala del gráfico
  const chartBaseUnit = historyData?.maxWeightUnit || "kg";

  const getNormalizedWeight = (weight: number, unit: string, baseUnit: string) => {
    if (!weight || !unit || unit === baseUnit) return weight;
    if (unit === "lbs" && baseUnit === "kg") return weight / 2.20462;
    if (unit === "kg" && baseUnit === "lbs") return weight * 2.20462;
    return weight;
  };

  // Calcula el peso máximo normalizado de las sesiones recientes para escalar el gráfico de barras
  let chartMaxWeight = 0;
  if (historyData?.recentSessions?.length > 0) {
    historyData.recentSessions.forEach((session: any) => {
      let sessionMax = 0;
      session.sets.forEach((s: any) => {
        // Omite barras, placas y peso corporal para el gráfico de peso
        if (s.weightUnit === "bars" || s.weightUnit === "plates" || s.weightUnit === "bodyweight") return;
        const normalized = getNormalizedWeight(s.weight, s.weightUnit, chartBaseUnit);
        if (normalized > sessionMax) sessionMax = normalized;
      });
      if (sessionMax > chartMaxWeight) chartMaxWeight = sessionMax;
    });
  }

  // Invierte el orden de las sesiones recientes para mostrar de la más antigua a la más reciente de izquierda a derecha
  const chartSessions = historyData?.recentSessions ? [...historyData.recentSessions].reverse() : [];


  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            padding: moderateScale(20),
            paddingBottom: moderateScale(20) + insets.bottom,
            maxHeight: "85%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: verticalScale(15),
            }}
          >
            <Text
              style={{
                fontSize: moderateScale(18),
                fontWeight: "bold",
                color: colors.textPrimary,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {exerciseName}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: scale(5) }}>
              <Feather name="x" size={moderateScale(24)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {historyData ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: verticalScale(30),
                  paddingTop: verticalScale(20),
                }}
              >
                {/* Max Volume (Left) */}
                <View style={{ alignItems: "center", width: "30%", zIndex: 10 }}>
                  <MaterialCommunityIcons name="crown" size={scale(24)} color="#F59E0B" style={{ marginBottom: verticalScale(2) }} />
                  <Text style={{ fontSize: moderateScale(11), color: colors.textSecondary, textAlign: "center", marginBottom: verticalScale(5) }} numberOfLines={1}>
                    {t("historyModal.maxVolume")}
                  </Text>
                  <View style={{ backgroundColor: colors.surface, padding: moderateScale(10), borderRadius: scale(12), alignItems: "center", width: "100%", minHeight: verticalScale(75), justifyContent: "center", borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
                    <Text style={{ fontSize: moderateScale(13), fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
                      {historyData.maxVolume > 0 ? `${historyData.maxVolume.toLocaleString()} ${historyData.maxVolumeUnit === "lbs" ? "lb" : historyData.maxVolumeUnit}` : "-"}
                    </Text>
                    {historyData.maxVolumeSets && historyData.maxVolumeSets.length > 0 && (
                      <Text style={{ fontSize: moderateScale(8), color: colors.textSecondary, textAlign: "center", marginTop: verticalScale(4) }}>
                        {historyData.maxVolumeSets.map((set: any) => {
                          let w = "";
                          if (set.weightUnit === "bars" || set.weightUnit === "plates") w = `${set.weight}`;
                          else if (set.weightUnit === "bodyweight") {
                            let unitToDisplay = set.bwUnit || (historyData.maxWeightUnit === "lbs" ? "lb" : "kg");
                            w = set.weight > 0 ? `BW+${set.weight} ${unitToDisplay}` : "BW";
                          }
                          else w = `${set.weight}${set.weightUnit === "lbs" ? "lb" : "kg"}`;
                          return `${w} x ${set.reps}`;
                        }).join(" • ")}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Max Weight (Center Podium) */}
                <View style={{ alignItems: "center", width: "35%", zIndex: 10 }}>
                  <MaterialCommunityIcons name="crown" size={scale(32)} color="#F59E0B" style={{ marginBottom: verticalScale(2) }} />
                  <Text style={{ fontSize: moderateScale(11), color: colors.textSecondary, textAlign: "center", marginBottom: verticalScale(5) }} numberOfLines={1}>
                    {t("historyModal.maxWeight")}
                  </Text>
                  <View style={{ backgroundColor: colors.surface, padding: moderateScale(10), borderRadius: scale(12), alignItems: "center", width: "100%", minHeight: verticalScale(90), justifyContent: "center", borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
                    <Text style={{ fontSize: moderateScale(15), fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
                      {historyData.maxWeight > 0 ? `${historyData.maxWeight.toLocaleString()} ${historyData.maxWeightUnit === "lbs" ? "lb" : historyData.maxWeightUnit}` : "-"}
                    </Text>
                    {historyData.maxWeightSet && (
                      <Text style={{ fontSize: moderateScale(8), color: colors.textSecondary, textAlign: "center", marginTop: verticalScale(4) }}>
                        {(() => {
                          const set = historyData.maxWeightSet;
                          let w = "";
                          if (set.weightUnit === "bars" || set.weightUnit === "plates") w = `${set.weight}`;
                          else if (set.weightUnit === "bodyweight") {
                            let unitToDisplay = set.bwUnit || (historyData.maxWeightUnit === "lbs" ? "lb" : "kg");
                            w = set.weight > 0 ? `BW+${set.weight} ${unitToDisplay}` : "BW";
                          }
                          else w = `${set.weight}${set.weightUnit === "lbs" ? "lb" : "kg"}`;
                          return `${w} x ${set.reps}`;
                        })()}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Max Bars/Plates or Empty (Right) */}
                <View style={{ alignItems: "center", width: "30%", zIndex: 10 }}>
                  {historyData.maxBars > 0 ? (
                    <>
                      <MaterialCommunityIcons name="crown" size={scale(24)} color="#F59E0B" style={{ marginBottom: verticalScale(2) }} />
                      <Text style={{ fontSize: moderateScale(11), color: colors.textSecondary, textAlign: "center", marginBottom: verticalScale(5) }} numberOfLines={1}>
                        {t("historyModal.maxBars")}
                      </Text>
                      <View style={{ backgroundColor: colors.surface, padding: moderateScale(10), borderRadius: scale(12), alignItems: "center", width: "100%", minHeight: verticalScale(75), justifyContent: "center", borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
                        <Text style={{ fontSize: moderateScale(13), fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
                          {historyData.maxBars}
                        </Text>
                      </View>
                    </>
                  ) : historyData.maxPlates > 0 ? (
                    <>
                      <MaterialCommunityIcons name="crown" size={scale(24)} color="#F59E0B" style={{ marginBottom: verticalScale(2) }} />
                      <Text style={{ fontSize: moderateScale(11), color: colors.textSecondary, textAlign: "center", marginBottom: verticalScale(5) }} numberOfLines={1}>
                        {t("historyModal.maxPlates")}
                      </Text>
                      <View style={{ backgroundColor: colors.surface, padding: moderateScale(10), borderRadius: scale(12), alignItems: "center", width: "100%", minHeight: verticalScale(75), justifyContent: "center", borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
                        <Text style={{ fontSize: moderateScale(13), fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
                          {historyData.maxPlates}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={{ width: "100%", minHeight: verticalScale(75) }} />
                  )}
                </View>
              </View>

              {/* Native Bar Chart */}
              {chartMaxWeight > 0 && chartSessions.length > 0 && (
                <View style={{ marginBottom: verticalScale(30) }}>
                  <Text style={{ fontSize: moderateScale(16), fontWeight: "bold", color: colors.textPrimary, marginBottom: verticalScale(15) }}>
                    Progreso (Peso Máximo)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: verticalScale(140), backgroundColor: colors.surface, borderRadius: scale(12), padding: moderateScale(15), borderWidth: 1, borderColor: colors.border }}>
                    {chartSessions.map((session: any, index: number) => {
                      let sessionMax = 0;
                      let sessionMaxUnit = "";
                      let sessionMaxNormalized = 0;

                      session.sets.forEach((s: any) => {
                        if (s.weightUnit === "bars" || s.weightUnit === "plates" || s.weightUnit === "bodyweight") return;

                        const normalized = getNormalizedWeight(s.weight, s.weightUnit, chartBaseUnit);
                        // Encontramos el máximo basado en el peso normalizado para asegurar una comparación precisa
                        if (normalized > sessionMaxNormalized) {
                          sessionMaxNormalized = normalized;
                          sessionMax = s.weight;
                          sessionMaxUnit = s.weightUnit === "lbs" ? "lb" : "kg";
                        }
                      });

                      // La altura máxima de la barra es el 70% para dejar espacio para el texto
                      const barHeight = sessionMaxNormalized > 0 ? (sessionMaxNormalized / chartMaxWeight) * 70 : 0;
                      const dateObj = new Date(session.date);
                      const dateString = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

                      return (
                        <View key={index} style={{ alignItems: "center", width: "15%", height: "100%", justifyContent: "flex-end" }}>
                          <Text style={{ fontSize: moderateScale(9), color: colors.textSecondary, marginBottom: verticalScale(5) }} numberOfLines={1}>
                            {sessionMax > 0 ? `${Math.round(sessionMax)} ${sessionMaxUnit}` : ""}
                          </Text>
                          <View style={{ height: `${barHeight}%`, width: "100%", backgroundColor: colors.primary, borderRadius: scale(4), minHeight: sessionMax > 0 ? 5 : 0 }} />
                          <Text style={{ fontSize: moderateScale(10), color: colors.textSecondary, marginTop: verticalScale(5) }} numberOfLines={1}>
                            {dateString}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <Text style={{ fontSize: moderateScale(16), fontWeight: "bold", color: colors.textPrimary, marginBottom: verticalScale(10) }}>
                {t("historyModal.recentSessions")}
              </Text>

              {historyData.recentSessions.map((session: any, index: number) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: scale(12),
                    padding: moderateScale(15),
                    marginBottom: verticalScale(10),
                  }}
                >
                  <Text style={{ fontSize: moderateScale(14), fontWeight: "bold", color: colors.textPrimary, marginBottom: verticalScale(8) }}>
                    {new Date(session.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </Text>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                    {session.sets.map((set: any, sIdx: number) => {
                      let formattedWeight = "";
                      if (set.weightUnit === "bars" || set.weightUnit === "plates") {
                        const translatedUnit = t(`activeWorkout.units.${set.weightUnit}`);
                        formattedWeight = `${set.weight} ${translatedUnit}`;
                      } else if (set.weightUnit === "bodyweight") {
                        let unitToDisplay = "";
                        if (set.bwUnit) {
                          unitToDisplay = set.bwUnit;
                        } else {
                          session.sets.forEach((st: any) => {
                            if (st.weightUnit === "kg" || st.weightUnit === "lbs") unitToDisplay = st.weightUnit === "lbs" ? "lb" : "kg";
                          });
                          if (!unitToDisplay) {
                            unitToDisplay = historyData.maxWeightUnit === "lbs" ? "lb" : "kg";
                          }
                        }
                        formattedWeight = set.weight > 0 ? `BW+${set.weight} ${unitToDisplay}` : "BW";
                      } else if (set.weightUnit === "km" || set.weightUnit === "mi") {
                        const translatedUnit = t(`activeWorkout.units.${set.weightUnit}`);
                        formattedWeight = `${set.weight} ${translatedUnit}`;
                      } else {
                        const unit = set.weightUnit === "lbs" ? "lb" : "kg";
                        formattedWeight = `${set.weight}${unit}`;
                      }

                      const setString = `${t("historyModal.set", { num: sIdx + 1 })}: ${formattedWeight} x ${set.reps}`;

                      return (
                        <View key={sIdx} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ fontSize: moderateScale(13), color: colors.textSecondary, lineHeight: moderateScale(22) }}>
                            {setString}
                          </Text>
                          {sIdx < session.sets.length - 1 && (
                            <Text style={{ fontSize: moderateScale(13), color: colors.textSecondary, marginHorizontal: scale(6) }}>
                              •
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ paddingVertical: verticalScale(30), alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: moderateScale(15), color: colors.textSecondary, textAlign: "center" }}>
                {t("historyModal.noHistory", "Aún no hay registros previos para este ejercicio.")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

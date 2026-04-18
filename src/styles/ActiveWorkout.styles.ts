import { Platform, StatusBar, StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },

    //Estado vacío (sin ejercicios)
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      color: colors.textSecondary,
    },
    emptyBtn: {
      marginTop: verticalScale(20),
    },
    emptyBtnText: {
      color: colors.primary,
    },

    //Cabecera
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: scale(15),
      paddingVertical: verticalScale(12),
      backgroundColor: colors.background,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
      marginLeft: scale(10),
    },
    finishBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      borderRadius: scale(6),
    },
    finishBtnText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(14),
    },

    //Estadisticas
    statsStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(10),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: verticalScale(10),
    },
    statBox: {
      flex: 1,
      alignItems: "flex-start",
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: moderateScale(12),
      marginBottom: verticalScale(4),
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
    statValuePrimary: {
      color: colors.primary,
    },

    //Tarjeta de ejercicio
    exerciseCard: {
      backgroundColor: colors.surface,
      borderRadius: scale(12),
      padding: scale(15),
      marginBottom: verticalScale(20),
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseCardActive: {
      borderColor: colors.primary,
      elevation: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: verticalScale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(5),
    },
    exerciseHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    exerciseHeader: {
      paddingVertical: verticalScale(5),
      marginBottom: verticalScale(5),
      flex: 1,
    },
    exerciseName: {
      color: colors.primary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
    },
    deleteExBtn: {
      padding: scale(5),
      paddingLeft: scale(15),
    },
    exerciseRestIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(15),
    },
    exerciseRestText: {
      color: colors.primary,
      fontSize: moderateScale(13),
      fontWeight: "600",
      marginLeft: scale(6),
    },

    //Tabla de series
    tableHeader: {
      flexDirection: "row",
      marginBottom: verticalScale(8),
      alignItems: "center",
    },
    tableHeaderText: {
      color: colors.textSecondary,
      fontSize: moderateScale(11),
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: scale(0.5),
    },
    colSetHeader: {
      width: scale(55),
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: moderateScale(11),
      fontWeight: "bold",
    },
    colPrevHeader: {
      flex: 1,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: moderateScale(11),
      fontWeight: "bold",
    },
    colInputHeader: { flex: 1, alignItems: "center", justifyContent: "center" },
    colCheckHeader: { width: scale(40), alignItems: "center" },

    colSet: {
      width: scale(55),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    colPrev: { flex: 1, alignItems: "center", justifyContent: "center" },
    colInput: { flex: 1, alignItems: "center", justifyContent: "center" },
    colCheck: {
      width: scale(40),
      alignItems: "center",
      justifyContent: "center",
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(8),
      borderRadius: scale(8),
      marginBottom: verticalScale(5),
    },
    setRowCompleted: {
      backgroundColor: "rgba(34, 197, 94, 0.15)",
    },

    setText: {
      color: colors.textPrimary,
      fontSize: moderateScale(15),
      fontWeight: "bold",
    },
    deleteSetIcon: {
      marginRight: scale(8),
    },
    deleteSetBadge: {
      width: scale(16),
      height: scale(16),
      borderRadius: scale(8),
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteSetLine: {
      width: scale(8),
      height: verticalScale(2),
      backgroundColor: "#FFF",
    },
    prevText: {
      color: colors.textSecondary,
      fontSize: moderateScale(14),
    },
    input: {
      backgroundColor: "transparent",
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
      textAlign: "center",
      width: "80%",
      alignSelf: "center",
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: verticalScale(2),
    },
    inputDisabled: {
      color: colors.textPrimary,
      borderBottomColor: "transparent",
    },
    checkButton: {
      width: scale(28),
      height: verticalScale(24),
      borderRadius: scale(4),
      justifyContent: "center",
      alignItems: "center",
    },
    checkButtonInactive: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checkButtonActive: {
      backgroundColor: "#22C55E",
    },

    //Pie de lista de ejercicios
    addSetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(10),
      paddingVertical: verticalScale(10),
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: scale(8),
    },
    addSetIcon: { marginRight: scale(5) },
    addSetText: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: moderateScale(14),
    },
    addExerciseBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(12),
      backgroundColor: "rgba(234, 88, 12, 0.1)",
      borderRadius: scale(8),
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
      marginBottom: verticalScale(20),
    },
    addExerciseBtnIcon: { marginRight: scale(8) },
    addExerciseBtnText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: moderateScale(16),
    },
    cancelWorkoutButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(15),
      marginTop: verticalScale(20),
      marginBottom: verticalScale(10),
    },
    cancelWorkoutText: {
      color: "#EF4444",
      fontWeight: "bold",
      fontSize: moderateScale(15),
    },

    //Temporizador de descanso flotante
    floatingRestBanner: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: scale(20),
      paddingTop: verticalScale(20),
      borderTopColor: colors.border,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(-3) },
      shadowOpacity: 0.5,
      shadowRadius: scale(5),
    },
    floatingRestAdjustBtn: {
      backgroundColor: colors.background,
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(16),
      borderRadius: scale(6),
    },
    floatingRestAdjustText: {
      color: colors.textPrimary,
      fontWeight: "bold",
      fontSize: moderateScale(16),
    },
    floatingRestTime: {
      color: colors.textPrimary,
      fontSize: moderateScale(26),
      fontWeight: "bold",
      fontVariant: ["tabular-nums"],
    },
    floatingRestSkipBtn: {
      backgroundColor: colors.primary,
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(16),
      borderRadius: scale(6),
    },
    floatingRestSkipText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(14),
    },

    //Modales de edición de descanso
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      paddingHorizontal: scale(20),
    },
    editRestModalContent: {
      backgroundColor: colors.surface,
      borderRadius: scale(20),
      padding: scale(25),
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    editRestTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
      marginBottom: verticalScale(20),
    },
    editRestControls: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(25),
    },
    editRestTimeDisplay: {
      color: colors.textPrimary,
      fontSize: moderateScale(32),
      fontWeight: "bold",
      fontVariant: ["tabular-nums"],
      marginHorizontal: scale(25),
    },
    editRestButtonsRow: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      gap: scale(15),
    },
    editRestBtn: {
      flex: 1,
      paddingVertical: verticalScale(12),
      borderRadius: scale(8),
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    editRestBtnPrimary: {
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    editRestBtnTransparent: {
      backgroundColor: "transparent",
    },
    editRestBtnText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(16),
    },
    editRestBtnTextSecondary: {
      color: colors.textPrimary,
    },

    //Modal de selección de unidades
    unitOptionBtn: {
      width: "100%",
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    unitOptionBtnLast: { borderBottomWidth: 0 },
    unitOptionTitle: {
      color: colors.primary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
      marginBottom: verticalScale(4),
    },
    unitOptionDesc: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
    },
    unitOptionsMargin: { marginTop: verticalScale(20) },

    //Modal de resumen de entrenamiento
    summaryOverlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    summaryHeader: {
      alignItems: "center",
      marginTop: verticalScale(40),
      marginBottom: verticalScale(30),
    },
    summaryHeaderTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(32),
      fontWeight: "900",
    },
    summaryHeaderSub: {
      color: colors.textSecondary,
      fontSize: moderateScale(16),
      marginTop: verticalScale(5),
    },
    summaryCard: {
      backgroundColor: colors.surface,
      marginHorizontal: scale(20),
      borderRadius: scale(24),
      padding: scale(25),
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: verticalScale(30),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: verticalScale(25),
    },
    summaryStatCol: { alignItems: "center" },
    summaryStatLabel: {
      color: colors.textSecondary,
      fontSize: moderateScale(14),
      fontWeight: "600",
    },
    summaryStatValue: {
      color: colors.textPrimary,
      fontSize: moderateScale(20),
      fontWeight: "bold",
      marginTop: verticalScale(5),
    },
    summaryStatUnit: { fontSize: moderateScale(14) },
    summaryMusclesTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
      marginBottom: verticalScale(15),
    },
    muscleRow: { marginBottom: verticalScale(15) },
    muscleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: verticalScale(6),
    },
    muscleName: { color: colors.textPrimary, fontSize: moderateScale(14) },
    musclePercentage: {
      color: colors.textSecondary,
      fontSize: moderateScale(14),
      fontWeight: "bold",
    },
    muscleBarBg: {
      height: verticalScale(8),
      backgroundColor: colors.background,
      borderRadius: scale(4),
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    muscleBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: scale(4),
    },
    noSetsValid: {
      color: colors.textSecondary,
      textAlign: "center",
      fontStyle: "italic",
      marginTop: verticalScale(10),
    },
    summaryFooter: {
      position: "absolute",
      left: scale(20),
      right: scale(20),
    },
    adWrapper: {
      alignItems: "center",
      marginBottom: verticalScale(15),
    },
    summaryFinishBtn: {
      backgroundColor: colors.primary,
      paddingVertical: verticalScale(16),
      borderRadius: scale(14),
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    summaryFinishBtnText: {
      color: "#FFF",
      fontSize: moderateScale(18),
      fontWeight: "bold",
    },
    summaryLoadingIcon: { marginRight: scale(10) },
  });

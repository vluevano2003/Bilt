import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const getHomeStyles = (colors: any) =>
  StyleSheet.create({
    //Contenedor principal y de contenido
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    content: {
      padding: scale(20),
      paddingTop: verticalScale(40),
      paddingBottom: verticalScale(100),
    },

    //Header
    headerRightContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: scale(20),
      gap: scale(20),
    },
    notificationIconContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadge: {
      position: "absolute",
      top: verticalScale(-4),
      right: scale(-6),
      backgroundColor: "#EF4444",
      minWidth: scale(18),
      height: scale(18),
      borderRadius: scale(9),
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadgeText: {
      color: "#FFF",
      fontSize: moderateScale(10),
      fontWeight: "bold",
    },
    dashboardPadding: {
      paddingBottom: verticalScale(15),
    },

    greetingContainer: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: verticalScale(10),
      marginBottom: verticalScale(25),
    },
    greetingText: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      letterSpacing: scale(-0.5),
      color: colors.primary,
    },
    usernameText: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      letterSpacing: scale(-0.5),
      color: colors.textPrimary,
    },

    //Tarjetas de resumen semanal
    card: {
      backgroundColor: colors.surface,
      padding: scale(20),
      borderRadius: scale(15),
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: verticalScale(25),
    },
    weeklySummaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(15),
    },
    weeklySummaryIcon: {
      marginRight: scale(8),
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statBoxLeft: {
      flex: 0.8,
      alignItems: "center",
      justifyContent: "center",
    },
    statBoxRight: {
      flex: 2.2,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      width: 1,
      height: "80%",
      backgroundColor: colors.border,
    },
    statNumber: {
      color: colors.primary,
      fontSize: moderateScale(26),
      fontWeight: "900",
      textAlign: "center",
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: moderateScale(14),
      marginTop: verticalScale(5),
      fontWeight: "500",
      textAlign: "center",
    },
    statLabelSmall: {
      color: colors.textSecondary,
      fontSize: moderateScale(12),
      marginTop: verticalScale(5),
      fontWeight: "500",
      textAlign: "center",
    },
    statLabelMarginBottom: {
      marginBottom: verticalScale(8),
      marginTop: 0,
    },

    daysContainer: {
      flexDirection: "row",
      gap: scale(4),
      justifyContent: "center",
    },
    dayBadge: {
      width: scale(24),
      height: scale(24),
      borderRadius: scale(12),
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
    dayBadgeText: {
      fontSize: moderateScale(10),
      fontWeight: "bold",
    },

    //Feedback Modal
    feedbackOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    feedbackContent: {
      backgroundColor: colors.background,
      flex: 1,
      borderTopLeftRadius: scale(20),
      borderTopRightRadius: scale(20),
      overflow: "hidden",
    },
    feedbackScrollContent: {
      paddingHorizontal: scale(20),
      flexGrow: 1,
    },
    feedbackInputWrapper: {
      backgroundColor: colors.surface,
      borderRadius: scale(12),
      borderWidth: 1,
      borderColor: colors.border,
      padding: scale(15),
      marginBottom: verticalScale(20),
    },
    feedbackInput: {
      color: colors.textPrimary,
      minHeight: verticalScale(120),
      textAlignVertical: "top",
      fontSize: moderateScale(15),
    },
    sendButton: {
      flexDirection: "row",
      padding: scale(16),
      borderRadius: scale(12),
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(10),
      shadowOffset: { width: 0, height: verticalScale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(5),
      elevation: 5,
    },
    sendButtonText: {
      fontSize: moderateScale(16),
      fontWeight: "bold",
      color: "#FFF",
    },
    sendButtonIcon: {
      marginRight: scale(8),
    },

    //Textos generales
    title: {
      fontSize: moderateScale(28),
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: scale(-0.5),
    },
    subtitle: {
      fontSize: moderateScale(16),
      color: colors.textSecondary,
      marginTop: verticalScale(5),
      marginBottom: verticalScale(25),
    },

    //Botones de acción
    actionButton: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      padding: scale(16),
      borderRadius: scale(12),
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(25),
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: verticalScale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(5),
      elevation: 5,
    },
    activeWorkoutButton: {
      backgroundColor: "#10B981",
      shadowColor: "#10B981",
    },
    actionButtonText: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },

    //Detalles de packs y rutinas
    bookmarkContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(8),
    },
    bookmarkIcon: {
      marginRight: scale(4),
    },
    creatorText: {
      fontSize: moderateScale(11),
      color: colors.primary,
      fontWeight: "bold",
    },
    packDescription: {
      color: colors.textSecondary,
      marginBottom: verticalScale(12),
      marginTop: verticalScale(4),
    },
    packRoutinesContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    packRoutinesIcon: {
      marginRight: scale(6),
    },
    packRoutinesText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: moderateScale(13),
    },
  });

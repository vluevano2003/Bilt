import { StyleSheet } from "react-native";

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
      padding: 20,
      paddingTop: 40,
      paddingBottom: 100,
    },

    //Header
    headerRightContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 20,
      gap: 20,
    },
    notificationIconContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadge: {
      position: "absolute",
      top: -4,
      right: -6,
      backgroundColor: "#EF4444",
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadgeText: {
      color: "#FFF",
      fontSize: 10,
      fontWeight: "bold",
    },
    dashboardPadding: {
      paddingBottom: 15,
    },

    greetingContainer: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 10,
      marginBottom: 25,
    },
    greetingText: {
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
      color: colors.primary,
    },
    usernameText: {
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
      color: colors.textPrimary,
    },

    //Tarjetas de resumen semanal
    card: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: 25,
    },
    weeklySummaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    weeklySummaryIcon: {
      marginRight: 8,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 18,
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
      fontSize: 26,
      fontWeight: "900",
      textAlign: "center",
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 5,
      fontWeight: "500",
      textAlign: "center",
    },
    statLabelSmall: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 5,
      fontWeight: "500",
      textAlign: "center",
    },
    statLabelMarginBottom: {
      marginBottom: 8,
      marginTop: 0,
    },

    daysContainer: {
      flexDirection: "row",
      gap: 4,
      justifyContent: "center",
    },
    dayBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
    dayBadgeText: {
      fontSize: 10,
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
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    feedbackScrollContent: {
      paddingHorizontal: 20,
      flexGrow: 1,
    },
    feedbackInputWrapper: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      marginBottom: 20,
    },
    feedbackInput: {
      color: colors.textPrimary,
      minHeight: 120,
      textAlignVertical: "top",
      fontSize: 15,
    },
    sendButton: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#FFF",
    },
    sendButtonIcon: {
      marginRight: 8,
    },

    //Textos generales
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 5,
      marginBottom: 25,
    },

    //Botones de acción
    actionButton: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    activeWorkoutButton: {
      backgroundColor: "#10B981",
      shadowColor: "#10B981",
    },
    actionButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "bold",
    },

    //Detalles de packs y rutinas
    bookmarkContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    bookmarkIcon: {
      marginRight: 4,
    },
    creatorText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "bold",
    },
    packDescription: {
      color: colors.textSecondary,
      marginBottom: 12,
      marginTop: 4,
    },
    packRoutinesContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    packRoutinesIcon: {
      marginRight: 6,
    },
    packRoutinesText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: 13,
    },
  });

import { Platform, StatusBar, StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: scale(20),
      paddingTop:
        Platform.OS === "android"
          ? (StatusBar.currentHeight || verticalScale(24)) + verticalScale(1)
          : verticalScale(50),
      paddingBottom: verticalScale(15),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: moderateScale(24),
      fontWeight: "bold",
      color: colors.textPrimary,
    },

    tabsContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      justifyContent: "space-between",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(16),
      paddingHorizontal: scale(5),
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: { borderBottomColor: colors.primary },
    tabText: {
      color: colors.textSecondary,
      fontSize: moderateScale(14),
      fontWeight: "600",
      textAlign: "center",
    },
    activeTabText: { color: colors.primary },
    listContainer: { padding: scale(20), paddingBottom: verticalScale(120) },
    routineCard: {
      backgroundColor: colors.surface,
      borderRadius: scale(12),
      padding: scale(15),
      marginBottom: verticalScale(15),
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(6),
    },
    routineName: {
      fontSize: moderateScale(18),
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    exercisePreview: {
      fontSize: moderateScale(14),
      color: colors.textSecondary,
      marginBottom: verticalScale(15),
      lineHeight: moderateScale(20),
    },
    startRoutineButton: {
      backgroundColor: colors.primary,
      borderRadius: scale(8),
      paddingVertical: verticalScale(12),
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    startRoutineText: {
      color: "#FFF",
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },
    fab: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? verticalScale(40) : verticalScale(30),
      right: scale(20),
      backgroundColor: colors.primary,
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(50),
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: moderateScale(16),
      textAlign: "center",
      marginTop: verticalScale(15),
      paddingHorizontal: scale(30),
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: scale(25),
      borderTopRightRadius: scale(25),
      padding: scale(25),
      paddingBottom:
        Platform.OS === "ios" ? verticalScale(60) : verticalScale(70),
      maxHeight: "92%",
    },

    modalOverlayCentered: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      paddingHorizontal: scale(20),
    },
    modalContentCentered: {
      backgroundColor: colors.surface,
      borderRadius: scale(20),
      padding: scale(25),
      maxHeight: "85%",
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      flexShrink: 1,
    },

    modalOverlayBottomSheet: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "flex-end",
      margin: 0,
      padding: 0,
    },
    modalContentBottomSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: scale(25),
      borderTopRightRadius: scale(25),
      padding: scale(25),
      width: "100%",
      maxHeight: "92%",
      flexShrink: 1,
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(20),
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(20),
      fontWeight: "bold",
    },
    label: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
      marginBottom: verticalScale(6),
      marginLeft: scale(4),
      fontWeight: "600",
    },
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(25),
      gap: scale(15),
    },

    actionButton: {
      backgroundColor: colors.surface,
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(30),
      borderRadius: scale(8),
      borderWidth: 1,
      borderColor: colors.border,
      width: "100%",
      alignItems: "center",
    },
    actionButtonText: {
      color: colors.textPrimary,
      fontWeight: "bold",
      fontSize: moderateScale(15),
    },
  });

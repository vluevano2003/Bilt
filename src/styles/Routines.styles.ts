import { Platform, StatusBar, StyleSheet } from "react-native";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop:
        Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 1 : 50,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
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
      paddingVertical: 16,
      paddingHorizontal: 5,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: { borderBottomColor: colors.primary },
    tabText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    activeTabText: { color: colors.primary },

    listContainer: { padding: 20, paddingBottom: 100 },

    routineCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    routineName: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    exercisePreview: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 15,
      lineHeight: 20,
    },
    startRoutineButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    startRoutineText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

    fab: {
      position: "absolute",
      bottom: 30,
      right: 20,
      backgroundColor: colors.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
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
      marginTop: 50,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginTop: 15,
      paddingHorizontal: 30,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      padding: 25,
      paddingBottom: Platform.OS === "ios" ? 40 : 25,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "bold" },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 6,
      marginLeft: 4,
      fontWeight: "600",
    },
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 25,
      gap: 15,
    },

    actionButton: {
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      width: "100%",
      alignItems: "center",
    },
    actionButtonText: {
      color: colors.textPrimary,
      fontWeight: "bold",
      fontSize: 15,
    },
  });

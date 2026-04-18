import { Platform, StatusBar, StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    //Contenedor principal y scroll
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { paddingBottom: verticalScale(40) },
    formContainer: { paddingBottom: verticalScale(60) },

    //Cabecera
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: scale(20),
      paddingTop:
        Platform.OS === "android"
          ? (StatusBar.currentHeight || verticalScale(24)) + verticalScale(1)
          : verticalScale(50),
      marginBottom: 0,
      zIndex: 10,
    },
    headerRightActions: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: scale(20),
      gap: scale(15),
    },
    iconButton: { zIndex: 10, padding: scale(5) },
    headerRightIcons: { flexDirection: "row", gap: scale(15), zIndex: 10 },

    //Información principal del perfil
    centeredProfileInfo: {
      alignItems: "center",
      paddingHorizontal: scale(20),
      marginBottom: verticalScale(25),
      marginTop: verticalScale(20),
    },
    avatarContainer: { marginBottom: verticalScale(10), position: "relative" },
    avatarCenterContainer: {
      alignSelf: "center",
      marginTop: verticalScale(10),
    },
    avatarPlaceholder: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      borderWidth: 2,
      borderColor: colors.primary,
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: scale(30),
      height: scale(30),
      borderRadius: scale(15),
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: colors.background,
    },
    usernameText: {
      fontSize: moderateScale(22),
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: verticalScale(15),
    },

    //Estatísticas sociales, biografía y datos públicos
    socialStatsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: scale(40),
      marginBottom: verticalScale(15),
    },
    socialStatBox: { alignItems: "center" },
    socialStatNumber: {
      fontSize: moderateScale(18),
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    socialStatLabel: {
      fontSize: moderateScale(14),
      color: colors.textSecondary,
    },
    bioContainer: {
      paddingHorizontal: scale(20),
      marginTop: verticalScale(10),
      marginBottom: verticalScale(5),
      alignItems: "center",
    },
    bioText: {
      textAlign: "center",
      fontSize: moderateScale(15),
    },
    publicDataContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: scale(10),
      marginBottom: verticalScale(15),
    },
    publicDataText: {
      fontSize: moderateScale(15),
      color: colors.textSecondary,
      fontWeight: "500",
    },

    //Botones de acción (seguir, aceptar/rechazar solicitud, cerrar sesión)
    actionButtonContainer: { width: "100%", marginTop: verticalScale(10) },
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
    followRequestContainer: {
      flexDirection: "row",
      gap: scale(10),
      justifyContent: "center",
    },
    acceptButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rejectButton: { flex: 1, backgroundColor: colors.surface },
    rejectButtonText: { color: colors.textPrimary },
    buttonTextWhite: { color: "#FFF" },
    logoutButton: {
      flexDirection: "row",
      backgroundColor: "transparent",
      padding: scale(15),
      borderRadius: scale(10),
      alignItems: "center",
      justifyContent: "center",
      marginTop: verticalScale(30),
      borderWidth: 1,
      borderColor: "#EF4444",
    },
    logoutText: {
      color: "#EF4444",
      fontSize: moderateScale(16),
      fontWeight: "bold",
    },

    //Estados vacíos (perfil sin publicaciones, sin seguidores, perfil privado, etc.)
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(20),
    },
    emptyStateTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(22),
      fontWeight: "bold",
      marginTop: verticalScale(20),
      textAlign: "center",
    },
    emptyStateText: {
      color: colors.textSecondary,
      marginTop: verticalScale(10),
      textAlign: "center",
      fontSize: moderateScale(16),
    },
    emptyStateActionBtn: {
      marginTop: verticalScale(30),
      backgroundColor: colors.primary,
      paddingHorizontal: scale(30),
    },
    privateContainer: { alignItems: "center", marginTop: verticalScale(40) },
    privateTitle: {
      color: colors.textPrimary,
      fontSize: moderateScale(18),
      fontWeight: "bold",
      marginTop: verticalScale(15),
    },
    privateText: { color: colors.textSecondary, marginTop: verticalScale(5) },

    //Pestañas y segmentos (Publicaciones/Rutinas, Estadísticas, Configuración, etc.)
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: colors.background,
      marginHorizontal: scale(20),
      marginBottom: verticalScale(15),
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: verticalScale(12),
      alignItems: "center",
      borderBottomWidth: 2,
      borderColor: "transparent",
    },
    segmentButtonActive: { borderColor: colors.primary },

    //Botones de segmento para formularios (editar perfil, cambiar contraseña, etc.)
    formSegmentContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: scale(10),
      marginBottom: verticalScale(15),
      padding: scale(4),
      borderWidth: 1,
      borderColor: colors.border,
    },
    formSegmentButton: {
      flex: 1,
      paddingVertical: verticalScale(10),
      alignItems: "center",
      borderRadius: scale(8),
    },
    formSegmentButtonActive: { backgroundColor: colors.primary },
    segmentText: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
      fontWeight: "600",
    },
    segmentTextActive: { color: colors.textPrimary },

    //Historial de actividad, publicaciones, rutinas, etc.
    historySectionContainer: {
      marginTop: verticalScale(10),
      paddingHorizontal: scale(20),
    },
    historySectionTitle: {
      fontSize: moderateScale(16),
      marginBottom: verticalScale(15),
      marginLeft: 0,
    },
    emptyHistoryText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: verticalScale(20),
    },
    historyCard: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
    historyDateText: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
      marginTop: verticalScale(2),
      marginBottom: verticalScale(4),
    },
    historyStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: verticalScale(5),
    },
    loadMoreBtn: {
      paddingVertical: verticalScale(12),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderRadius: scale(10),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: verticalScale(40),
    },
    loadMoreText: { color: colors.primary, fontWeight: "bold" },
    routineCard: {
      backgroundColor: colors.surface,
      padding: scale(15),
      borderRadius: scale(10),
      marginBottom: verticalScale(15),
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    routineInfo: { flex: 1 },
    routineName: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "bold",
      marginBottom: verticalScale(5),
    },
    routineDetails: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
    },
    routineDetailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: verticalScale(5),
    },
    routineStatText: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
    },
    bookmarkBtn: {
      padding: scale(10),
      backgroundColor: colors.background,
      borderRadius: scale(10),
    },

    //Modales generales (editar perfil, opciones de publicación, reportar usuario, etc.)
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "flex-end",
      margin: 0,
      padding: 0,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: scale(25),
      borderTopRightRadius: scale(25),
      padding: scale(25),
      width: "100%",
      maxHeight: "85%",
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
      fontSize: moderateScale(22),
      fontWeight: "bold",
    },

    //Modales específicos (opciones de publicación, reportar usuario, etc.)
    optionsModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    optionsModalContent: {
      backgroundColor: colors.background,
      padding: scale(20),
      borderTopLeftRadius: scale(20),
      borderTopRightRadius: scale(20),
    },
    optionsModalHandle: {
      width: scale(40),
      height: verticalScale(4),
      backgroundColor: colors.border,
      borderRadius: scale(2),
      alignSelf: "center",
      marginBottom: verticalScale(20),
    },
    optionsModalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(15),
    },
    optionsModalRowBorder: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(15),
      borderTopWidth: 1,
      borderColor: colors.border,
      marginTop: verticalScale(10),
    },
    optionsModalTextDanger: {
      fontSize: moderateScale(16),
      color: "#EF4444",
      fontWeight: "600",
    },
    optionsModalText: {
      fontSize: moderateScale(16),
      color: colors.textPrimary,
    },
    optionsModalIcon: { marginRight: scale(15) },
    reportModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: scale(20),
    },
    reportModalContent: {
      backgroundColor: colors.background,
      borderRadius: scale(15),
      padding: scale(20),
    },
    reportModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(15),
    },
    reportModalTitle: {
      fontSize: moderateScale(18),
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    reportReasonPrompt: {
      color: colors.textSecondary,
      marginBottom: verticalScale(15),
    },
    reportInput: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: scale(10),
      padding: scale(15),
      minHeight: verticalScale(100),
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: verticalScale(20),
    },
    reportSubmitBtn: {
      padding: scale(15),
      borderRadius: scale(10),
      alignItems: "center",
    },
    reportSubmitText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: moderateScale(16),
    },

    //Configuración y ajustes (privacidad, notificaciones, idioma, etc.)
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "500",
    },

    //Lista de seguidores/seguidos, solicitudes de seguimiento, etc.
    socialListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    socialListAvatar: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      marginRight: scale(15),
      borderWidth: 1,
      borderColor: colors.primary,
    },
    socialListAvatarPlaceholder: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      marginRight: scale(15),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    socialListUsername: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "600",
    },

    //Inputs de edición de perfil, cambio de contraseña, etc.
    label: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
      marginBottom: verticalScale(6),
      marginLeft: scale(4),
      fontWeight: "600",
    },
    rowInputs: { flexDirection: "row", justifyContent: "space-between" },
    halfInput: { width: "48%" },
    readOnlyInput: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: colors.textSecondary,
      paddingHorizontal: 0,
    },
  });

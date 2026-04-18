import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flexContainer: { flex: 1 },

    topTabs: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: verticalScale(15),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabText: {
      fontSize: moderateScale(16),
      color: colors.textSecondary,
      fontWeight: "600",
    },
    tabTextActive: {
      color: colors.primary,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingBottom: verticalScale(5),
    },
    content: { padding: scale(20), flex: 1 },

    //Buscador y feed
    searchBar: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: scale(12),
      borderRadius: scale(10),
      alignItems: "center",
      marginBottom: verticalScale(20),
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      marginLeft: scale(10),
      fontSize: moderateScale(16),
    },
    placeholderText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: verticalScale(40),
    },
    searchLoader: { marginTop: verticalScale(20) },
    feedLoader: { marginTop: verticalScale(40) },

    //Tarjeta de usuario en feed
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userAvatar: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      marginRight: scale(15),
      borderWidth: 1,
      borderColor: colors.primary,
    },
    userAvatarPlaceholder: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      marginRight: scale(15),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    usernameText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: moderateScale(16),
      fontWeight: "600",
    },

    //Tarjeta de publicación en feed
    feedCard: {
      backgroundColor: colors.surface,
      borderRadius: scale(12),
      padding: scale(15),
      marginBottom: verticalScale(15),
      borderWidth: 1,
      borderColor: colors.border,
    },
    feedHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: verticalScale(12),
    },
    feedAvatar: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      marginRight: scale(12),
      borderWidth: 1,
      borderColor: colors.primary,
    },
    feedAvatarPlaceholder: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      marginRight: scale(12),
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    feedHeaderText: {
      flex: 1,
    },
    feedUsername: {
      color: colors.textPrimary,
      fontWeight: "bold",
      fontSize: moderateScale(15),
    },
    feedAction: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
      marginTop: verticalScale(2),
    },
    feedTime: {
      color: colors.textSecondary,
      fontSize: moderateScale(12),
    },
    feedContent: {
      backgroundColor: colors.background,
      padding: scale(12),
      borderRadius: scale(8),
      borderWidth: 1,
      borderColor: colors.border,
    },
    feedTitle: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: moderateScale(16),
      marginBottom: verticalScale(6),
    },
    feedStats: {
      flexDirection: "row",
      gap: scale(15),
    },
    feedStatText: {
      color: colors.textSecondary,
      fontSize: moderateScale(13),
    },

    //Anuncios
    adContainer: {
      alignItems: "center",
      marginVertical: verticalScale(10),
    },
    adLabelText: {
      fontSize: moderateScale(10),
      color: colors.textSecondary,
      marginBottom: verticalScale(5),
    },
    loadMoreBtn: {
      paddingVertical: verticalScale(12),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderRadius: scale(10),
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: scale(20),
      marginTop: verticalScale(10),
      marginBottom: verticalScale(40),
    },
    loadMoreText: {
      color: colors.primary,
      fontWeight: "bold",
    },
  });

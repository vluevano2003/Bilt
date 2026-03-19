import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export const GoogleSignInButton = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t("common.or")}</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() =>
          Alert.alert(t("google.comingSoonTitle"), t("google.comingSoonMsg"))
        }
      >
        <AntDesign
          name="google"
          size={24}
          color={colors.textPrimary}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.googleButtonText}>{t("google.continue")}</Text>
      </TouchableOpacity>
    </>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: {
      color: colors.textSecondary,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    googleButton: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    googleButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
  });

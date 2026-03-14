import { StyleSheet } from "react-native";
import { colors } from "../constants/theme";

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
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
  statBox: {
    alignItems: "center",
    flex: 1,
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
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 5,
    fontWeight: "500",
  },
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
});

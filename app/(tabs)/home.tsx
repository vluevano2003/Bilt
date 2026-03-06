import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../src/constants/theme";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>¡Mutación en progreso!</Text>
      <Text style={styles.subtitle}>Bienvenido a tu panel principal.</Text>

      {/* Tarjeta de Resumen Rápido */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen Semanal</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Entrenos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4,500</Text>
            <Text style={styles.statLabel}>Volumen (kg)</Text>
          </View>
        </View>
      </View>

      {/* Botón de acción rápida */}
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>
          + Iniciar Entrenamiento Vacío
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: "900", color: colors.primary },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 5,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { alignItems: "center", flex: 1 },
  statNumber: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  statLabel: { color: colors.textSecondary, fontSize: 14, marginTop: 5 },
  actionButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
});

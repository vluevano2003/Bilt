import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/constants/theme";

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Aquí podrás crear y editar tus plantillas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: colors.textSecondary, fontSize: 16 },
});

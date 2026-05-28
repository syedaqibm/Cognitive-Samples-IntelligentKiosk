import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/theme";

export function Loader() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

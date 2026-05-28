import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

interface Props {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.h3, { color: colors.textPrimary, textAlign: "center" }]}>{title}</Text>
      {description ? (
        <Text style={[typography.body, styles.description]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  description: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { useAuth } from "@/auth/AuthContext";
import { API_BASE_URL } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Signed in as</Text>
        <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.xs }]}>
          {user.displayName}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>{user.email}</Text>
        {user.houseLabel ? (
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {user.houseLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>API</Text>
        <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.xs }]}>{API_BASE_URL}</Text>
      </View>

      <Button title="Log out" variant="danger" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});

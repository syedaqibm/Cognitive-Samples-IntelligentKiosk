import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";

export function SignupScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [houseLabel, setHouseLabel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signUp(displayName.trim(), email.trim(), password, houseLabel);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Use a display name your neighbors will recognise. The house label is shown to buyers at pickup.
        </Text>
        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
        <TextField
          label="House label (optional)"
          hint='e.g. "123 Maple St" or "Apt 4B".'
          value={houseLabel}
          onChangeText={setHouseLabel}
        />
        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          secureTextEntry
          autoComplete="new-password"
          hint="Minimum 8 characters."
          value={password}
          onChangeText={setPassword}
        />
        {error ? (
          <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
        ) : null}
        <Button title="Create account" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, backgroundColor: colors.background, flexGrow: 1 },
});

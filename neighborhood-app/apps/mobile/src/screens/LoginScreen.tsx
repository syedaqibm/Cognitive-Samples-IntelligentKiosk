import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";
import type { AuthStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text style={[typography.h1, { color: colors.primary }]}>Neighborhood</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Buy and pick up home-grown food from people on your block.
          </Text>
        </View>
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
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}
        <Button title="Sign in" onPress={onSubmit} loading={submitting} />
        <Button
          title="Create an account"
          variant="secondary"
          onPress={() => navigation.navigate("Signup")}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, backgroundColor: colors.background, flexGrow: 1 },
  intro: { marginBottom: spacing.xl, gap: spacing.xs },
});

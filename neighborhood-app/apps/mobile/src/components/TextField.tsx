import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
}

export function TextField({ label, error, hint, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.caption, styles.label]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...rest}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <Text style={[typography.small, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.small, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, marginTop: spacing.xs },
  hint: { color: colors.textMuted, marginTop: spacing.xs },
});

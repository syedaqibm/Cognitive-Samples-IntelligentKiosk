import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

type Variant = "primary" | "secondary" | "danger";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
};

const FG: Record<Variant, string> = {
  primary: "#fff",
  secondary: colors.primary,
  danger: "#fff",
};

export function Button({ title, onPress, variant = "primary", loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: BG[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderColor: colors.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <View style={styles.content}>
          <Text style={[typography.bodyBold, { color: FG[variant] }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { OrderDto } from "@neighborhood/shared";
import { unitLabel } from "@neighborhood/shared";
import { absoluteUrl } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";

interface Props {
  order: OrderDto;
  perspective: "buyer" | "seller";
  onPress?: () => void;
}

const STATUS_COLOR: Record<OrderDto["status"], string> = {
  PENDING: colors.warning,
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export function OrderCard({ order, perspective, onPress }: Props) {
  const photo = absoluteUrl(order.listingPhotoUrl);
  const counterparty = perspective === "buyer" ? order.sellerName : order.buyerName;
  const counterpartyLabel = perspective === "buyer" ? "Pick up from" : "Buyer";
  const total = order.quantity * order.unitPriceSnapshot;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={{ fontSize: 24 }}>🥕</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={typography.bodyBold} numberOfLines={1}>
          {order.listingTitle}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {order.quantity} {unitLabel(order.unit)} · ${total.toFixed(2)}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {counterpartyLabel}: {counterparty}
          {perspective === "buyer" && order.sellerHouseLabel ? ` · ${order.sellerHouseLabel}` : ""}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[typography.small, { color: STATUS_COLOR[order.status], fontWeight: "700" }]}>
          {order.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  photoWrap: { marginRight: spacing.md },
  photo: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  right: { alignItems: "flex-end", marginLeft: spacing.sm },
});

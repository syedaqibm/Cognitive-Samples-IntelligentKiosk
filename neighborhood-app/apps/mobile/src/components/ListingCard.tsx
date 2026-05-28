import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ListingDto } from "@neighborhood/shared";
import { categoryLabel, unitLabel } from "@neighborhood/shared";
import { absoluteUrl } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";

interface Props {
  listing: ListingDto;
  onPress?: () => void;
  showSeller?: boolean;
  rightSlot?: React.ReactNode;
}

export function ListingCard({ listing, onPress, showSeller = true, rightSlot }: Props) {
  const photo = absoluteUrl(listing.photoUrl);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={typography.bodyBold} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {categoryLabel(listing.category)} · {listing.quantityAvailable} {unitLabel(listing.unit)} available
        </Text>
        {showSeller ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {listing.sellerName}
            {listing.sellerHouseLabel ? ` · ${listing.sellerHouseLabel}` : ""}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[typography.bodyBold, { color: colors.primary }]}>
          ${listing.pricePerUnit.toFixed(2)}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>per {unitLabel(listing.unit)}</Text>
        {rightSlot}
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
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  right: { alignItems: "flex-end", marginLeft: spacing.sm },
});

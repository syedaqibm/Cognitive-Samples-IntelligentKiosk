import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { categoryLabel, unitLabel } from "@neighborhood/shared";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Loader } from "@/components/Loader";
import { listings, orders } from "@/api/endpoints";
import { ApiError, absoluteUrl } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { colors, radius, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ListingDetail">;

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const qc = useQueryClient();
  const { user } = useAuth();
  const [qty, setQty] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => listings.get(listingId).then((r) => r.listing),
  });

  const orderMutation = useMutation({
    mutationFn: () => {
      const parsed = Number(qty.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return Promise.reject(new Error("Enter a quantity greater than zero"));
      }
      return orders.create({ listingId, quantity: parsed });
    },
    onSuccess: ({ order }) => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert(
        "Order placed",
        `Show this PIN to the seller at pickup:\n\nPIN: ${order.pickupPin}\n\nYour order is in "My orders".`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    },
    onError: (err) => {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to place order");
    },
  });

  if (query.isPending) return <Loader />;
  if (query.isError || !query.data) {
    return (
      <View style={styles.errorWrap}>
        <Text style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
          {query.error instanceof ApiError ? query.error.message : "Failed to load listing."}
        </Text>
      </View>
    );
  }

  const listing = query.data;
  const photo = absoluteUrl(listing.photoUrl);
  const isOwn = listing.sellerId === user?.id;
  const soldOut = listing.quantityAvailable <= 0 || !listing.isActive;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={{ fontSize: 48 }}>🌱</Text>
          </View>
        )}
      </View>

      <Text style={[typography.h1, { color: colors.textPrimary }]}>{listing.title}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {categoryLabel(listing.category)} · ${listing.pricePerUnit.toFixed(2)} per {unitLabel(listing.unit)}
      </Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
        Seller: {listing.sellerName}
        {listing.sellerHouseLabel ? ` · ${listing.sellerHouseLabel}` : ""}
      </Text>

      {listing.description ? (
        <View style={styles.descriptionCard}>
          <Text style={typography.body}>{listing.description}</Text>
        </View>
      ) : null}

      <Text style={[typography.body, { marginTop: spacing.lg, color: colors.textPrimary }]}>
        {listing.quantityAvailable} {unitLabel(listing.unit)} available
      </Text>

      {isOwn ? (
        <Text style={[typography.body, { marginTop: spacing.lg, color: colors.textSecondary }]}>
          This is your listing. Buyers will see it in Browse.
        </Text>
      ) : soldOut ? (
        <Text style={[typography.body, { marginTop: spacing.lg, color: colors.danger }]}>
          This listing is no longer available.
        </Text>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <TextField
            label={`Quantity (${unitLabel(listing.unit)})`}
            keyboardType="decimal-pad"
            value={qty}
            onChangeText={setQty}
          />
          {error ? (
            <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
          ) : null}
          <Button
            title={orderMutation.isPending ? "Placing order…" : "Place order"}
            loading={orderMutation.isPending}
            onPress={() => {
              setError(null);
              orderMutation.mutate();
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  photoWrap: { marginBottom: spacing.lg, alignItems: "center" },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  descriptionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

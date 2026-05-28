import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { unitLabel } from "@neighborhood/shared";
import { Loader } from "@/components/Loader";
import { orders } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SellerPickup">;

export function SellerPickupScreen({ route }: Props) {
  const { orderId } = route.params;
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orders.get(orderId).then((r) => r.order),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (query.data?.status === "COMPLETED") {
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  }, [query.data?.status, qc]);

  if (query.isPending) return <Loader />;
  if (query.isError || !query.data) {
    return (
      <View style={styles.errorWrap}>
        <Text style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
          {query.error instanceof ApiError ? query.error.message : "Failed to load order."}
        </Text>
      </View>
    );
  }

  const order = query.data;
  const completed = order.status === "COMPLETED";
  const total = order.quantity * order.unitPriceSnapshot;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[typography.h2, styles.title]}>{order.listingTitle}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
        {order.quantity} {unitLabel(order.unit)} · ${total.toFixed(2)} · for {order.buyerName}
      </Text>

      {completed ? (
        <View style={styles.completedCard}>
          <Text style={[typography.h2, { color: colors.success, textAlign: "center" }]}>Picked up</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm }]}>
            Completed{order.completedAt ? ` at ${new Date(order.completedAt).toLocaleTimeString()}` : ""}.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.qrWrap}>
            <QRCode value={order.orderToken} size={240} backgroundColor="#fff" color={colors.textPrimary} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}>
            Show this code to your buyer at pickup.
          </Text>

          <View style={styles.pinCard}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Pickup PIN</Text>
            <Text style={styles.pinValue}>{order.pickupPin}</Text>
            <Text style={[typography.small, { color: colors.textMuted, textAlign: "center" }]}>
              The buyer will enter this PIN after scanning the code.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, alignItems: "center", gap: spacing.lg, flexGrow: 1 },
  title: { color: colors.textPrimary, textAlign: "center" },
  qrWrap: {
    backgroundColor: "#fff",
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  pinValue: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: 8,
    color: colors.primary,
  },
  completedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.xl,
    width: "100%",
  },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

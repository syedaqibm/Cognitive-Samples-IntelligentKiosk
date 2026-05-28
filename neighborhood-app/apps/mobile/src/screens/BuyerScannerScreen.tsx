import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { unitLabel } from "@neighborhood/shared";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Loader } from "@/components/Loader";
import { orders } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "BuyerScanner">;

export function BuyerScannerScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orders.get(orderId).then((r) => r.order),
  });

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const confirmMutation = useMutation({
    mutationFn: () => orders.confirm(orderId, { token: token.trim(), pin: pin.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      Alert.alert("Pickup confirmed", "Enjoy! The seller's listing has been updated.", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err) => {
      scannedRef.current = false;
      setError(err instanceof ApiError ? err.message : "Pickup verification failed");
    },
  });

  const onBarcode = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    if (!data) return;
    scannedRef.current = true;
    setToken(data.trim());
  };

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
  const total = order.quantity * order.unitPriceSnapshot;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>{order.listingTitle}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          {order.quantity} {unitLabel(order.unit)} · ${total.toFixed(2)} · from {order.sellerName}
          {order.sellerHouseLabel ? ` · ${order.sellerHouseLabel}` : ""}
        </Text>

        <Text style={[typography.bodyBold, { marginBottom: spacing.sm }]}>1. Scan the seller's QR code</Text>
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={onBarcode}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
                Camera permission is required to scan the QR code.
              </Text>
              {permission && !permission.granted ? (
                <Pressable onPress={requestPermission} style={styles.permissionButton}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Grant camera access</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
          Or paste the token below if you can't scan.
        </Text>

        <TextField
          label="Order token"
          value={token}
          onChangeText={(v) => {
            scannedRef.current = false;
            setToken(v);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[typography.bodyBold, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
          2. Enter the 4-digit PIN
        </Text>
        <TextField
          label="Pickup PIN"
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
        />

        {error ? (
          <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
        ) : null}

        <Button
          title={confirmMutation.isPending ? "Confirming…" : "Confirm pickup"}
          loading={confirmMutation.isPending}
          disabled={!token || pin.length !== 4}
          onPress={() => {
            setError(null);
            confirmMutation.mutate();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cameraWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CATEGORIES,
  UNITS,
  categoryLabel,
  unitLabel,
  createListingSchema,
  type Category,
  type Unit,
} from "@neighborhood/shared";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { listings, type ListingPhoto } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, typography } from "@/theme";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "NewListing">;

interface PickedPhoto {
  uri: string;
  name: string;
  type: string;
}

export function NewListingScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("VEGETABLE");
  const [unit, setUnit] = useState<Unit>("EACH");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      setError("Photo library permission was denied.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto(assetToPhoto(res.assets[0]));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      setError("Camera permission was denied.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto(assetToPhoto(res.assets[0]));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = createListingSchema.safeParse({
        title: title.trim(),
        description: description.trim() || null,
        category,
        unit,
        pricePerUnit: Number(price.replace(",", ".")),
        quantityAvailable: Number(quantity.replace(",", ".")),
      });
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        throw new Error(first?.message ?? "Please complete the form");
      }
      const photoArg: ListingPhoto | undefined = photo
        ? { uri: photo.uri, name: photo.name, type: photo.type }
        : undefined;
      return listings.create(parsed.data, photoArg);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      navigation.goBack();
    },
    onError: (err) => {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to create listing");
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Heirloom tomatoes" />
        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{categoryLabel(c)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Unit</Text>
        <View style={styles.chips}>
          {UNITS.map((u) => (
            <Pressable key={u} onPress={() => setUnit(u)} style={[styles.chip, unit === u && styles.chipActive]}>
              <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{unitLabel(u)}</Text>
            </Pressable>
          ))}
        </View>

        <TextField label="Price (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <TextField label="Quantity available" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />

        <Text style={styles.sectionLabel}>Photo (optional)</Text>
        <View style={styles.photoArea}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPreview, styles.photoFallback]}>
              <Text style={{ fontSize: 32 }}>📷</Text>
            </View>
          )}
        </View>
        <View style={styles.photoButtons}>
          <Button title="Take photo" variant="secondary" onPress={takePhoto} style={{ flex: 1 }} />
          <View style={{ width: spacing.md }} />
          <Button title="Pick photo" variant="secondary" onPress={pickFromLibrary} style={{ flex: 1 }} />
        </View>
        {photo ? (
          <Button
            title="Remove photo"
            variant="secondary"
            onPress={() => setPhoto(null)}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}

        {error ? (
          <Text style={[typography.small, { color: colors.danger, marginTop: spacing.md }]}>{error}</Text>
        ) : null}

        <Button
          title={mutation.isPending ? "Posting…" : "Post listing"}
          onPress={() => {
            setError(null);
            mutation.mutate();
          }}
          loading={mutation.isPending}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function assetToPhoto(asset: ImagePicker.ImagePickerAsset): PickedPhoto {
  const uri = asset.uri;
  const lastSegment = uri.split("/").pop() ?? "photo.jpg";
  const lower = lastSegment.toLowerCase();
  const type = asset.mimeType ?? (lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg");
  const name = lastSegment.includes(".") ? lastSegment : "photo.jpg";
  return { uri, name, type };
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textPrimary },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  photoArea: { alignItems: "center", marginBottom: spacing.sm },
  photoPreview: { width: "100%", height: 180, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoButtons: { flexDirection: "row", marginTop: spacing.sm },
});

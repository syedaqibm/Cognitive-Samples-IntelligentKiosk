import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { listings } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";
import type { AppTabsParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, "MyListings">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MyListingsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: () => listings.mine().then((r) => r.listings),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => listings.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err) => {
      Alert.alert("Could not delete", err instanceof ApiError ? err.message : "Please try again.");
    },
  });

  if (query.isPending) return <Loader />;
  if (query.isError) {
    return (
      <View style={styles.errorWrap}>
        <Text style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
          {query.error instanceof ApiError ? query.error.message : "Failed to load your listings."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        contentContainerStyle={styles.list}
        data={query.data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="No listings yet"
            description="Post your home-grown produce so neighbors can buy from you."
          />
        }
        renderItem={({ item }) => (
          <View>
            <ListingCard
              listing={item}
              showSeller={false}
              onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
            />
            <Pressable
              onPress={() =>
                Alert.alert("Delete listing", `Remove "${item.title}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => removeMutation.mutate(item.id) },
                ])
              }
              style={styles.deleteButton}
            >
              <Text style={{ color: colors.danger, fontWeight: "600" }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable
        onPress={() => navigation.navigate("NewListing")}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 30 }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 96, flexGrow: 1 },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  deleteButton: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});

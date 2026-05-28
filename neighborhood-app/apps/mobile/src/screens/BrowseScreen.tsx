import { useQuery } from "@tanstack/react-query";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { listings } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";
import type { AppTabsParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, "Browse">,
  NativeStackScreenProps<RootStackParamList>
>;

export function BrowseScreen({ navigation }: Props) {
  const query = useQuery({
    queryKey: ["listings", "browse"],
    queryFn: () => listings.browse().then((r) => r.listings),
  });

  if (query.isPending) return <Loader />;

  if (query.isError) {
    const message = query.error instanceof ApiError ? query.error.message : "Failed to load listings.";
    return (
      <View style={styles.errorWrap}>
        <Text style={[typography.body, { color: colors.danger, textAlign: "center" }]}>{message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={query.data}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
      ListEmptyComponent={
        <EmptyState
          title="No listings yet"
          description="When neighbors post home-grown produce, it shows up here."
        />
      }
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

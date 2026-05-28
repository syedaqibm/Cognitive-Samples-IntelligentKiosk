import { useQuery } from "@tanstack/react-query";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { orders } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";
import type { AppTabsParamList, RootStackParamList } from "@/navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, "MyOrders">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MyOrdersScreen({ navigation }: Props) {
  const query = useQuery({
    queryKey: ["orders", "buyer"],
    queryFn: () => orders.list("buyer").then((r) => r.orders),
  });

  if (query.isPending) return <Loader />;
  if (query.isError) {
    return (
      <View style={styles.errorWrap}>
        <Text style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
          {query.error instanceof ApiError ? query.error.message : "Failed to load your orders."}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={query.data}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
      ListEmptyComponent={
        <EmptyState
          title="No orders yet"
          description="Place an order from the Browse tab; it will show up here."
        />
      }
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          perspective="buyer"
          onPress={() => {
            if (item.status === "PENDING") {
              navigation.navigate("BuyerScanner", { orderId: item.id });
            }
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  errorWrap: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});

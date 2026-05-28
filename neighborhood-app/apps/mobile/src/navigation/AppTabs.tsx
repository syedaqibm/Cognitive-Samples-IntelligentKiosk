import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { colors } from "@/theme";
import { BrowseScreen } from "@/screens/BrowseScreen";
import { MyListingsScreen } from "@/screens/MyListingsScreen";
import { MyOrdersScreen } from "@/screens/MyOrdersScreen";
import { PickupsScreen } from "@/screens/PickupsScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import type { AppTabsParamList } from "./types";

const Tabs = createBottomTabNavigator<AppTabsParamList>();

function tabIcon(label: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 18, lineHeight: 22 }}>{label}</Text>
  );
}

export function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ title: "Browse", tabBarIcon: tabIcon("🥕") }}
      />
      <Tabs.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{ title: "My listings", tabBarLabel: "Listings", tabBarIcon: tabIcon("🌱") }}
      />
      <Tabs.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: "My orders", tabBarLabel: "Orders", tabBarIcon: tabIcon("🧺") }}
      />
      <Tabs.Screen
        name="Pickups"
        component={PickupsScreen}
        options={{ title: "Pickups", tabBarIcon: tabIcon("📦") }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile", tabBarIcon: tabIcon("👤") }}
      />
    </Tabs.Navigator>
  );
}

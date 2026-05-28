import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors } from "@/theme";
import { LoginScreen } from "@/screens/LoginScreen";
import { SignupScreen } from "@/screens/SignupScreen";
import { ListingDetailScreen } from "@/screens/ListingDetailScreen";
import { NewListingScreen } from "@/screens/NewListingScreen";
import { SellerPickupScreen } from "@/screens/SellerPickupScreen";
import { BuyerScannerScreen } from "@/screens/BuyerScannerScreen";
import { AppTabs } from "./AppTabs";
import type { AuthStackParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Sign in" }} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ title: "Create account" }} />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        {user ? (
          <>
            <RootStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
            <RootStack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
              options={{ title: "Listing" }}
            />
            <RootStack.Screen
              name="NewListing"
              component={NewListingScreen}
              options={{ title: "New listing" }}
            />
            <RootStack.Screen
              name="SellerPickup"
              component={SellerPickupScreen}
              options={{ title: "Pickup code" }}
            />
            <RootStack.Screen
              name="BuyerScanner"
              component={BuyerScannerScreen}
              options={{ title: "Confirm pickup" }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

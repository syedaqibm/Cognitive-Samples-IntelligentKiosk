import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppTabsParamList = {
  Browse: undefined;
  MyListings: undefined;
  MyOrders: undefined;
  Pickups: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Tabs: NavigatorScreenParams<AppTabsParamList>;
  ListingDetail: { listingId: string };
  NewListing: undefined;
  SellerPickup: { orderId: string };
  BuyerScanner: { orderId: string };
};

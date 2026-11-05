import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    // Newer Expo SDKs (edge-to-edge) removed setPositionAsync / setBackgroundColorAsync,
    // so only call what exists instead of crashing the whole app.
    const nb: any = NavigationBar;
    try {
      if (typeof nb.setPositionAsync === "function") nb.setPositionAsync("absolute");
      if (typeof nb.setBackgroundColorAsync === "function") nb.setBackgroundColorAsync("#ffffff01");
      if (typeof nb.setButtonStyleAsync === "function") nb.setButtonStyleAsync("dark");
      else if (typeof nb.setStyle === "function") nb.setStyle("dark");
    } catch (e) {
      console.log("[TabLayout] NavigationBar setup skipped", e);
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="order"
        options={{
          title: "Order",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      /> 

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
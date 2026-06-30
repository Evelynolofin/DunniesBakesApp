import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { orderStore } from "@/constants/OrderStore";
import { requestNotificationPermission } from "@/constants/Notificationservice";

export default function RootLayout() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    requestNotificationPermission();

    orderStore.processPendingSchedule();

    orderStore.startForegroundWatcher();
    return () => orderStore.stopForegroundWatcher();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        orderStore.processPendingSchedule();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | Record<string, string>
        | undefined;

      orderStore.processPendingSchedule();

      if (data?.screen === "order") {
        router.push("/(tabs)/order" as any);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
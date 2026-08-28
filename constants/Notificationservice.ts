import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: "order" | "promo" | "auth" | "system" | "payment";
  read: boolean;
  timestamp: number;
  data?: Record<string, string>;
};

const CURRENT_USER_KEY = "currentUserEmail";
const GUEST_SCOPE       = "guest"; 

async function getUserScope(): Promise<string> {
  try {
    const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return email ? email.toLowerCase().trim() : GUEST_SCOPE;
  } catch {
    return GUEST_SCOPE;
  }
}

async function notificationsKey(): Promise<string> {
  const scope = await getUserScope();
  return `app_notifications_${scope}`;
}

async function prefsKey(): Promise<string> {
  const scope = await getUserScope();
  return `notification_prefs_${scope}`;
}

export type NotificationPrefs = {
  notifications: boolean;
  orderUpdates:  boolean; 
};

const DEFAULT_PREFS: NotificationPrefs = {
  notifications: true,
  orderUpdates:  true,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const key = await prefsKey();
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setNotificationPrefs(
  prefs: Partial<NotificationPrefs>
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs();
  const updated = { ...current, ...prefs };
  const key = await prefsKey();
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F6410B",
    });
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F6410B",
    });
    await Notifications.setNotificationChannelAsync("payments", {
      name: "Payments",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F6410B",
    });
    await Notifications.setNotificationChannelAsync("promos", {
      name: "Promotions & Rewards",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F6410B",
    });
  }

  return true;
}

export async function getStoredNotifications(): Promise<AppNotification[]> {
  try {
    const key = await notificationsKey();
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveNotifications(list: AppNotification[]): Promise<void> {
  const key = await notificationsKey();
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

export async function addNotification(
  n: Omit<AppNotification, "id" | "read" | "timestamp">
): Promise<AppNotification> {
  const item: AppNotification = {
    ...n,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    timestamp: Date.now(),
  };
  const current = await getStoredNotifications();
  const updated = [item, ...current].slice(0, 50);
  await saveNotifications(updated);
  return item;
}

export async function markAllRead(): Promise<void> {
  const list = await getStoredNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  await saveNotifications(updated);
  await Notifications.setBadgeCountAsync(0);
}

export async function markOneRead(id: string): Promise<void> {
  const list = await getStoredNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  await saveNotifications(updated);
  const unread = updated.filter((n) => !n.read).length;
  await Notifications.setBadgeCountAsync(unread);
}

export async function deleteNotification(id: string): Promise<void> {
  const list = await getStoredNotifications();
  const updated = list.filter((n) => n.id !== id);
  await saveNotifications(updated);
}

export async function clearAllNotifications(): Promise<void> {
  await saveNotifications([]);
  await Notifications.setBadgeCountAsync(0);
}

export async function getUnreadCount(): Promise<number> {
  const list = await getStoredNotifications();
  return list.filter((n) => !n.read).length;
}

export async function clearCurrentUserNotificationData(): Promise<void> {
  try {
    const nKey = await notificationsKey();
    const pKey = await prefsKey();
    await AsyncStorage.multiRemove([nKey, pKey]);
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
  channelId = "default"
): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.notifications) return;
  if (channelId === "orders" && !prefs.orderUpdates) return;

  const granted = await requestNotificationPermission();
  if (granted) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: true,
        ...(Platform.OS === "android" ? { channelId } : {}),
      },
      trigger: null,
    });
  }

  const type: AppNotification["type"] =
    channelId === "orders" ? "order" :
    channelId === "payments" ? "payment" :
    channelId === "promos" ? "promo" :
    "system";
  await addNotification({ title, body, type, data });
}

export async function notifyOrderPlaced(orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "Order Confirmed! ✅",
    `Your order #${orderRef} has been confirmed and we're getting started.`,
    { screen: "order" },
    "orders"
  );
}

export async function notifyOrderPreparing(orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "We're Cooking! 🍳",
    `Order #${orderRef} is being freshly prepared. Won't be long!`,
    { screen: "order" },
    "orders"
  );
}

export async function notifyOrderReady(orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "Order Ready! 🎉",
    `Order #${orderRef} is ready for pickup. Come get it while it's hot!`,
    { screen: "order" },
    "orders"
  );
}

export async function notifyOrderOnTheWay(orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "On the Way! 🚴",
    `Your rider has picked up order #${orderRef} and is heading to you now.`,
    { screen: "order" },
    "orders"
  );
}

export async function notifyOrderDelivered(orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "Order Delivered! 🍽️",
    `Order #${orderRef} has been delivered. Enjoy your meal!`,
    { screen: "order" },
    "orders"
  );
}

export async function notifyOrderCancelled(orderRef: string): Promise<void> {
  await addNotification({
    title: "Order Cancelled ❌",
    body: `Order #${orderRef} has been cancelled. Tap to see details.`,
    type: "order",
    data: { screen: "order" },
  });
}

export async function notifyLoginSuccess(name: string): Promise<void> {
  await addNotification({
    title: "Welcome back! 👋",
    body: `You're signed in as ${name}. Enjoy your meal!`,
    type: "auth",
  });
}

export async function notifySignUp(name: string): Promise<void> {
  await addNotification({
    title: "Account Created! 🎊",
    body: `Welcome to Dunnies Kitchen, ${name}! Start exploring our menu.`,
    type: "auth",
  });
}

export async function notifyWalletTopUp(amount: number, reference: string): Promise<void> {
  await scheduleLocalNotification(
    "Wallet Topped Up! 💰",
    `₦${amount.toLocaleString()} has been added to your wallet.`,
    { screen: "wallet", reference },
    "payments"
  );
}

export async function notifyWalletDebit(
  amount: number,
  reference: string,
  orderRef?: string
): Promise<void> {
  await scheduleLocalNotification(
    "Wallet Payment Sent 👛",
    `₦${amount.toLocaleString()} was deducted from your wallet${
      orderRef ? ` for order #${orderRef}` : ""
    }.`,
    { screen: "wallet", reference },
    "payments"
  );
}

/**
 * Fires for EVERY order payment regardless of method (wallet, paystack,
 * transfer, cash) — wording differs because cash/transfer are still
 * pending at the point the order is placed, while wallet/paystack are
 * already confirmed.
 */
export async function notifyOrderPayment(
  method: "wallet" | "paystack" | "transfer" | "cash",
  amount: number,
  reference: string,
  orderRef: string
): Promise<void> {
  const amt = `₦${amount.toLocaleString()}`;

  const copy: Record<typeof method, { title: string; body: string }> = {
    wallet: {
      title: "Payment Confirmed 💳",
      body: `${amt} was paid from your wallet for order #${orderRef}.`,
    },
    paystack: {
      title: "Payment Confirmed 💳",
      body: `${amt} payment for order #${orderRef} was confirmed via Paystack.`,
    },
    transfer: {
      title: "Bank Transfer Pending 🏦",
      body: `Complete your ${amt} bank transfer for order #${orderRef} to confirm payment.`,
    },
    cash: {
      title: "Cash Payment Pending 💵",
      body: `Pay ${amt} in cash when order #${orderRef} arrives.`,
    },
  };

  const { title, body } = copy[method];
  await scheduleLocalNotification(title, body, { screen: "wallet", reference, orderRef }, "payments");
}

export async function notifyPointsEarned(points: number, orderRef: string): Promise<void> {
  await scheduleLocalNotification(
    "You Just Earned Reward Points! 🎁",
    `You earned ${points.toLocaleString()} points from order #${orderRef}. Redeem them for a discount on your next order!`,
    { screen: "loyalty", orderRef },
    "promos"
  );
}

export async function notifyPointsRedeemed(
  points: number,
  discountAmount: number,
  orderRef: string
): Promise<void> {
  await scheduleLocalNotification(
    "Points Redeemed 🏷️",
    `You used ${points.toLocaleString()} points for ₦${discountAmount.toLocaleString()} off order #${orderRef}.`,
    { screen: "loyalty", orderRef },
    "promos"
  );
}
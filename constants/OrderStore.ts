import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { addNotification, getNotificationPrefs } from "@/constants/Notificationservice";

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  family: string;
  price: number;
  quantity: number;
  image: { uri: string };
};

export type Order = {
  id: string;
  reference: string;
  items: OrderItem[];
  status: OrderStatus;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "card" | "transfer" | "cash";
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  note?: string;
  placedAt: string;
  updatedAt?: string;
};

const STATUS_NOTIFICATIONS: Record<
  OrderStatus,
  { title: string; body: (ref: string) => string }
> = {
  confirmed: {
    title: "Order Confirmed! ✅",
    body: (ref) => `Your order #${ref} has been confirmed and we're getting started.`,
  },
  preparing: {
    title: "We're Cooking! 🍳",
    body: (ref) => `Order #${ref} is being freshly prepared. Won't be long!`,
  },
  ready: {
    title: "Order Ready! 🎉",
    body: (ref) => `Order #${ref} is ready for pickup. Come get it while it's hot!`,
  },
  on_the_way: {
    title: "On the Way! 🚴",
    body: (ref) => `Your rider has picked up order #${ref} and is heading to you now.`,
  },
  delivered: {
    title: "Order Delivered! 🍽️",
    body: (ref) => `Order #${ref} has been delivered. Enjoy your meal!`,
  },
  cancelled: {
    title: "Order Cancelled ❌",
    body: (ref) => `Order #${ref} has been cancelled. Tap to see details.`,
  },
};

const STEP_DELAY_SECONDS = 2 * 60; 

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

async function ordersKeyFor(scope: string): Promise<string> {
  return `dunnies_orders_${scope}`;
}

async function scheduleKeyFor(scope: string): Promise<string> {
  return `dunnies_order_schedule_${scope}`;
}

type ScheduleEntry = {
  orderId:   string;
  reference: string;
  status:    OrderStatus;
  fireAtMs:  number;
  notifId:   string;
  applied:   boolean;
  scope:     string;
};

async function getSchedule(scope: string): Promise<ScheduleEntry[]> {
  try {
    const key = await scheduleKeyFor(scope);
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveSchedule(scope: string, entries: ScheduleEntry[]): Promise<void> {
  const key = await scheduleKeyFor(scope);
  await AsyncStorage.setItem(key, JSON.stringify(entries));
}

class OrderStore {
  private listeners: Array<() => void> = [];

  addListener(fn: () => void)    { this.listeners.push(fn); }
  removeListener(fn: () => void) { this.listeners = this.listeners.filter((l) => l !== fn); }
  private notify()               { this.listeners.forEach((l) => l()); }

  async getAll(): Promise<Order[]> {
    try {
      const scope = await getUserScope();
      const key = await ordersKeyFor(scope);
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async getAllForScope(scope: string): Promise<Order[]> {
    try {
      const key = await ordersKeyFor(scope);
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async saveForScope(scope: string, orders: Order[]): Promise<void> {
    const key = await ordersKeyFor(scope);
    await AsyncStorage.setItem(key, JSON.stringify(orders));
  }

  async save(order: Order): Promise<void> {
    const scope = await getUserScope();
    const all = await this.getAllForScope(scope);
    all.unshift(order);
    await this.saveForScope(scope, all);
    this.notify();

    const msg = STATUS_NOTIFICATIONS.confirmed;
    const prefs = await getNotificationPrefs();

    if (prefs.notifications && prefs.orderUpdates) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body:  msg.body(order.reference),
          data:  { orderId: order.id, screen: "order" },
          sound: true,
        },
        trigger: null,
      });
    }

    await addNotification({
      title: msg.title,
      body:  msg.body(order.reference),
      type:  "order",
      data:  { orderId: order.id, screen: "order" },
    });
  }

  async autoAdvance(
    orderId: string,
    deliveryMethod: "delivery" | "pickup",
    reference?: string
  ): Promise<void> {
    const scope = await getUserScope();

    let ref = reference;
    if (!ref) {
      const all = await this.getAllForScope(scope);
      ref = all.find((o) => o.id === orderId)?.reference;
    }
    if (!ref) return;

    const steps: OrderStatus[] =
      deliveryMethod === "pickup"
        ? ["preparing", "ready", "delivered"]
        : ["preparing", "on_the_way", "delivered"];

    const schedule = await getSchedule(scope);
    const prefs = await getNotificationPrefs();
    const pushEnabled = prefs.notifications && prefs.orderUpdates;

    let secondsFromNow = STEP_DELAY_SECONDS;
    let fireAt = Date.now() + STEP_DELAY_SECONDS * 1000;

    for (const status of steps) {
      const msg = STATUS_NOTIFICATIONS[status];
      let notifId = "";

      if (pushEnabled) {
        notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title,
            body:  msg.body(ref),
            data:  { orderId, status, screen: "order" },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsFromNow,
            repeats: false,
          },
        });
      }

      schedule.push({
        orderId,
        reference: ref,
        status,
        fireAtMs: fireAt,
        notifId,
        applied: false,
        scope,
      });

      secondsFromNow += STEP_DELAY_SECONDS;
      fireAt += STEP_DELAY_SECONDS * 1000;
    }

    await saveSchedule(scope, schedule);
  }

  async processPendingSchedule(): Promise<void> {
    const scope = await getUserScope();
    const schedule = await getSchedule(scope);
    const now = Date.now();
    let changed = false;

    for (const entry of schedule) {
      if (entry.applied) continue;
      if (entry.fireAtMs > now) continue;

      await this._applyStatus(scope, entry.orderId, entry.status, entry.reference);
      entry.applied = true;
      changed = true;
    }

    if (changed) {
      const pruned = schedule.filter(
        (e) => !e.applied || now - e.fireAtMs < 24 * 60 * 60 * 1000
      );
      await saveSchedule(scope, pruned);
      this.notify();
    }
  }

  private async _applyStatus(
    scope: string,
    orderId: string,
    status: OrderStatus,
    reference: string
  ) {
    const all = await this.getAllForScope(scope);
    const idx = all.findIndex(o => o.id === orderId);

    if (idx === -1) return;

    const current = all[idx].status;

    if (current === "cancelled" || current === "delivered") {
      return;
    }

    if (current !== status) {
      all[idx] = {
        ...all[idx],
        status,
        updatedAt: new Date().toISOString(),
      };

      await this.saveForScope(scope, all);
    }

    const msg = STATUS_NOTIFICATIONS[status];

    await addNotification({
      title: msg.title,
      body: msg.body(reference),
      type: "order",
      data: { orderId, screen: "order" },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const scope = await getUserScope();
    const all = await this.getAllForScope(scope);
    const idx = all.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
    await this.saveForScope(scope, all);
    if (status === "cancelled" || status === "delivered") {
      await this.cancelScheduledFor(orderId);
    }
    this.notify();

    const msg = STATUS_NOTIFICATIONS[status];
    const ref = all[idx].reference;

    if (status === "cancelled") {
      await addNotification({
        title: msg.title,
        body:  msg.body(ref),
        type:  "order",
        data:  { orderId, screen: "order" },
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body:  msg.body(ref),
          data:  { orderId, screen: "order" },
          sound: true,
        },
        trigger: null,
      });
      await addNotification({
        title: msg.title,
        body:  msg.body(ref),
        type:  "order",
        data:  { orderId, screen: "order" },
      });
    }
  }

  async cancelScheduledFor(orderId: string): Promise<void> {
    const scope = await getUserScope();
    const schedule = await getSchedule(scope);
    const mine = schedule.filter((e) => e.orderId === orderId && !e.applied);
    for (const entry of mine) {
      if (!entry.notifId) continue;
      try {
        await Notifications.cancelScheduledNotificationAsync(entry.notifId);
      } catch {}
    }
    const remaining = schedule.filter((e) => e.orderId !== orderId);
    await saveSchedule(scope, remaining);
  }

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  startForegroundWatcher() {
    if (this.pollHandle) return;
    this.pollHandle = setInterval(() => {
      this.processPendingSchedule();
    }, 5000);
  }

  stopForegroundWatcher() {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  async clear(): Promise<void> {
    const scope = await getUserScope();
    const ordersKey   = await ordersKeyFor(scope);
    const scheduleKey = await scheduleKeyFor(scope);

    const schedule = await getSchedule(scope);
    for (const entry of schedule) {
      if (!entry.applied && entry.notifId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(entry.notifId);
        } catch {}
      }
    }

    await AsyncStorage.multiRemove([ordersKey, scheduleKey]);
    this.notify();
  }
}

export const orderStore = new OrderStore();
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  placedAt: string; // ISO string
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "card" | "transfer" | "cash";
  address?: string;
  city?: string;
  state?: string;
  fullName: string;
  phone: string;
  email: string;
  note?: string;
};

const STORAGE_KEY = "chop_chop_orders";

type Listener = () => void;
const listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const orderStore = {
  addListener(fn: Listener) {
    listeners.push(fn);
  },
  removeListener(fn: Listener) {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  },

  async getAll(): Promise<Order[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Order[];
    } catch {
      return [];
    }
  },

  async save(order: Order): Promise<void> {
    try {
      const existing = await this.getAll();
      // newest first
      const updated = [order, ...existing];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      notify();
    } catch (e) {
      console.error("orderStore.save failed", e);
    }
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const existing = await this.getAll();
      const updated = existing.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      notify();
    } catch (e) {
      console.error("orderStore.updateStatus failed", e);
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    notify();
  },

  autoAdvance(orderId: string, deliveryMethod: "delivery" | "pickup") {
  const steps: OrderStatus[] = deliveryMethod === "pickup"
    ? ["confirmed", "preparing", "ready", "delivered"]
    : ["confirmed", "preparing", "on_the_way", "delivered"];

  const INTERVAL = 120_000;

  steps.slice(1).forEach((status, i) => {
    setTimeout(() => {
      this.updateStatus(orderId, status);
    }, INTERVAL * (i + 1));
  });
},
};
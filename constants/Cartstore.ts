import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "app_cart_v1";

export type CartProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: { uri: string };
  category: string;
  family: string;
  tag?: string;
  quantity: number;
};

type Listener = () => void;

class CartStore {
  private items: CartProduct[] = [];
  private listeners: Set<Listener> = new Set();
  private loaded = false;

  async load() {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      if (raw) this.items = JSON.parse(raw);
    } catch (_) {}
    this.loaded = true;
    this.notify();
  }

  private async save() {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(this.items));
    } catch (_) {}
  }

  addListener(fn: Listener) {
    this.listeners.add(fn);
  }

  removeListener(fn: Listener) {
    this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  getItems(): CartProduct[] {
    return [...this.items];
  }

  getItem(id: string): CartProduct | undefined {
    return this.items.find((i) => i.id === id);
  }

  getTotalQuantity(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  /** Returns the category + family currently in the cart, or null if empty. */
  getCartScope(): { category: string; family: string } | null {
    if (this.items.length === 0) return null;
    return { category: this.items[0].category, family: this.items[0].family };
  }

  tryAdd(
    product: Omit<CartProduct, "quantity">
  ): "added" | "wrong_family" | "wrong_category" {
    const scope = this.getCartScope();

    if (scope) {
      if (scope.category !== product.category) return "wrong_category";
      if (scope.family !== product.family) return "wrong_family";
    }

    this.forceAdd(product);
    return "added";
  }

  /** Clears cart then adds the item — call after user confirms replacement. */
  forceAdd(product: Omit<CartProduct, "quantity">) {
    const idx = this.items.findIndex((i) => i.id === product.id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], quantity: this.items[idx].quantity + 1 };
    } else {
      this.items = [...this.items, { ...product, quantity: 1 }];
    }
    this.save();
    this.notify();
  }

  replaceAndAdd(product: Omit<CartProduct, "quantity">) {
    this.items = [{ ...product, quantity: 1 }];
    this.save();
    this.notify();
  }

  increase(id: string) {
    this.items = this.items.map((i) =>
      i.id === id ? { ...i, quantity: i.quantity + 1 } : i
    );
    this.save();
    this.notify();
  }

  decrease(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    if (item.quantity === 1) {
      this.items = this.items.filter((i) => i.id !== id);
    } else {
      this.items = this.items.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
      );
    }
    this.save();
    this.notify();
  }

  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
    this.notify();
  }

  clear() {
    this.items = [];
    this.save();
    this.notify();
  }
}

export const cartStore = new CartStore();
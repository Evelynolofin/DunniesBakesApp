import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_KEY = "currentUserEmail";
const GUEST_SCOPE       = "guest";

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

async function getUserScope(): Promise<string> {
  try {
    const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return email ? email.toLowerCase().trim() : GUEST_SCOPE;
  } catch {
    return GUEST_SCOPE;
  }
}

function cartKeyFor(scope: string): string {
  return `app_cart_v1_${scope}`;
}

class CartStore {
  private items: CartProduct[] = [];
  private listeners: Set<Listener> = new Set();

  private loadedScope: string | null = null;
  async load() {
    const scope = await getUserScope();

    if (this.loadedScope === scope) return; 

    try {
      const raw = await AsyncStorage.getItem(cartKeyFor(scope));
      this.items = raw ? JSON.parse(raw) : [];
    } catch {
      this.items = [];
    }

    this.loadedScope = scope;
    this.notify();
  }

  async reloadForCurrentUser() {
    this.loadedScope = null;
    await this.load();
  }

  private async save() {
    try {
      const scope = this.loadedScope ?? (await getUserScope());
      await AsyncStorage.setItem(cartKeyFor(scope), JSON.stringify(this.items));
    } catch {}
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

  resetInMemory() {
    this.items = [];
    this.loadedScope = null;
    this.notify();
  }

  async clearForCurrentUser() {
    const scope = await getUserScope();
    try {
      await AsyncStorage.removeItem(cartKeyFor(scope));
    } catch {}
    this.items = [];
    this.loadedScope = null;
    this.notify();
  }
}

export const cartStore = new CartStore();
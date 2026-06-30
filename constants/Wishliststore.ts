import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_KEY = "currentUserEmail";
const GUEST_SCOPE       = "guest";

export type WishlistProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: { uri: string };
  category: string;
  family: string;
  tag?: string;
  savedAt: string;
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

function wishlistKeyFor(scope: string): string {
  return `app_wishlist_v1_${scope}`;
}

class WishlistStore {
  private items: WishlistProduct[] = [];
  private listeners: Set<Listener> = new Set();
  private loadedScope: string | null = null;

  async load() {
    const scope = await getUserScope();
    if (this.loadedScope === scope) return;
    try {
      const raw = await AsyncStorage.getItem(wishlistKeyFor(scope));
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
      await AsyncStorage.setItem(wishlistKeyFor(scope), JSON.stringify(this.items));
    } catch {}
  }

  addListener(fn: Listener) { this.listeners.add(fn); }
  removeListener(fn: Listener) { this.listeners.delete(fn); }
  private notify() { this.listeners.forEach((fn) => fn()); }

  async getAll(): Promise<WishlistProduct[]> {
    await this.load();
    return [...this.items];
  }

  async isWishlisted(id: string): Promise<boolean> {
    await this.load();
    return this.items.some((i) => i.id === id);
  }

  async toggle(product: Omit<WishlistProduct, "savedAt">): Promise<"added" | "removed"> {
    await this.load();
    const idx = this.items.findIndex((i) => i.id === product.id);
    let action: "added" | "removed";
    if (idx > -1) {
      this.items = this.items.filter((i) => i.id !== product.id);
      action = "removed";
    } else {
      this.items = [{ ...product, savedAt: new Date().toISOString() }, ...this.items];
      action = "added";
    }
    await this.save();
    this.notify();
    return action;
  }

  async remove(id: string): Promise<void> {
    await this.load();
    this.items = this.items.filter((i) => i.id !== id);
    await this.save();
    this.notify();
  }

  async clear(): Promise<void> {
    this.items = [];
    await this.save();
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
      await AsyncStorage.removeItem(wishlistKeyFor(scope));
    } catch {}
    this.items = [];
    this.loadedScope = null;
    this.notify();
  }
}

export const wishlistStore = new WishlistStore();
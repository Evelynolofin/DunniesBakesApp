import AsyncStorage from "@react-native-async-storage/async-storage";

export type WishlistProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: { uri: string };
  category: string;
  family: string;
  tag?: string;
  savedAt: string; // ISO string
};

const STORAGE_KEY = "chop_chop_wishlist";

type Listener = () => void;
const listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const wishlistStore = {
  _cache: null as WishlistProduct[] | null,

  addListener(fn: Listener) {
    listeners.push(fn);
  },
  removeListener(fn: Listener) {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  },

  async getAll(): Promise<WishlistProduct[]> {
    try {
      if (this._cache) return this._cache;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this._cache = raw ? JSON.parse(raw) : [];
      return this._cache!;
    } catch {
      return [];
    }
  },

  async isWishlisted(id: string): Promise<boolean> {
    const items = await this.getAll();
    return items.some((i) => i.id === id);
  },

  async toggle(product: Omit<WishlistProduct, "savedAt">): Promise<"added" | "removed"> {
    const items = await this.getAll();
    const idx = items.findIndex((i) => i.id === product.id);
    let updated: WishlistProduct[];
    let action: "added" | "removed";

    if (idx > -1) {
      updated = items.filter((i) => i.id !== product.id);
      action = "removed";
    } else {
      updated = [{ ...product, savedAt: new Date().toISOString() }, ...items];
      action = "added";
    }

    this._cache = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notify();
    return action;
  },

  async remove(id: string): Promise<void> {
    const items = await this.getAll();
    const updated = items.filter((i) => i.id !== id);
    this._cache = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notify();
  },

  async clear(): Promise<void> {
    this._cache = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    notify();
  },
};
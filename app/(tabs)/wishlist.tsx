import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { wishlistStore, WishlistProduct } from "@/constants/Wishliststore";
import { cartStore } from "@/constants/Cartstore";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";

function tagColor(tag: string) {
  switch (tag) {
    case "Popular": return "#F6410B";
    case "Spicy":   return "#E53935";
    case "New":     return "#43A047";
    case "Local":   return "#8D6E63";
    default:        return ORANGE;
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function WishlistCard({
  item,
  onRemove,
  onAddToCart,
}: {
  item: WishlistProduct;
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  function handleRemove() {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(onRemove);
  }

  return (
    <Animated.View style={[card.wrap, { opacity: fadeAnim }]}>
      <View style={card.imageWrap}>
        <Image source={item.image} style={card.image} resizeMode="cover" />
        {item.tag && (
          <View style={[card.tag, { backgroundColor: tagColor(item.tag) }]}>
            <Text style={card.tagText}>{item.tag}</Text>
          </View>
        )}
        <TouchableOpacity style={card.heartBtn} onPress={handleRemove} activeOpacity={0.8}>
          <Ionicons name="heart" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <View style={card.info}>
        <View style={card.topRow}>
          <Text style={card.family}>{item.family}</Text>
          <Text style={card.savedAt}>Saved {timeAgo(item.savedAt)}</Text>
        </View>
        <Text style={card.name} numberOfLines={1}>{item.name}</Text>
        <Text style={card.desc} numberOfLines={2}>{item.description}</Text>

        <View style={card.footer}>
          <Text style={card.price}>₦{item.price.toLocaleString()}</Text>
          <TouchableOpacity style={card.cartBtn} onPress={onAddToCart} activeOpacity={0.85}>
            <Ionicons name="bag-add-outline" size={15} color={WHITE} />
            <Text style={card.cartBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function useToast() {
  const [msg, setMsg] = useState("");
  const opacity = React.useRef(new Animated.Value(0)).current;

  const show = useCallback((message: string) => {
    setMsg(message);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const Toast = (
    <Animated.View style={[toast.wrap, { opacity }]} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={16} color={WHITE} />
      <Text style={toast.text}>{msg}</Text>
    </Animated.View>
  );

  return { show, Toast };
}

export default function WishlistScreen() {
  const [items,   setItems]   = useState<WishlistProduct[]>([]);
  const [filter,  setFilter]  = useState("All");
  const [loading, setLoading] = useState(true);
  const { show: showToast, Toast } = useToast();

  const load = useCallback(async () => {
    const all = await wishlistStore.getAll();
    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    wishlistStore.addListener(load);
    return () => wishlistStore.removeListener(load);
  }, [load]);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))];

  const filtered = filter === "All"
    ? items
    : items.filter((i) => i.category.toLowerCase() === filter.toLowerCase());

  async function handleRemove(id: string) {
    await wishlistStore.remove(id);
  }

  async function handleAddToCart(item: WishlistProduct) {
    const result = cartStore.tryAdd(item);
    if (result === "added") {
      showToast(`${item.name} added to cart`);
    } else {
      Alert.alert(
        "Different order in cart",
        `Your cart has items from a different section. Replace cart with ${item.name}?`,
        [
          { text: "Keep cart", style: "cancel" },
          {
            text: "Replace",
            style: "destructive",
            onPress: () => {
              cartStore.replaceAndAdd(item);
              showToast(`${item.name} added to cart`);
            },
          },
        ]
      );
    }
  }

  function clearAll() {
    Alert.alert(
      "Clear Wishlist",
      "Remove all saved items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => wishlistStore.clear(),
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wishlist</Text>
          {items.length > 0 && (
            <Text style={styles.headerSub}>{items.length} saved item{items.length !== 1 ? "s" : ""}</Text>
          )}
        </View>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={MUTED} />
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Loading…</Text>
        </View>
      ) : filtered.length === 0 && items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={48} color={ORANGE} />
          </View>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySub}>
            Tap the ♡ on any item while browsing to save it here for later.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace("/(tabs)/home" as any)}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No {filter.toLowerCase()} items saved</Text>
          <TouchableOpacity onPress={() => setFilter("All")}>
            <Text style={styles.showAll}>Show all saved items</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filtered.length > 1 && (
            <TouchableOpacity
              style={styles.addAllBtn}
              activeOpacity={0.85}
              onPress={() => {
                let added = 0;
                filtered.forEach((item) => {
                  if (cartStore.tryAdd(item) === "added") added++;
                });
                showToast(added > 0 ? `${added} item${added > 1 ? "s" : ""} added to cart` : "Cart conflict — add items one by one");
              }}
            >
              <Ionicons name="bag-add-outline" size={17} color={WHITE} />
              <Text style={styles.addAllText}>Add all to cart</Text>
            </TouchableOpacity>
          )}

          {filtered.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.id)}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {Toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 54,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: BLACK },
  headerSub:   { fontSize: 12, color: MUTED, marginTop: 2 },
  clearBtn:    { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  clearText:   { fontSize: 13, color: MUTED },

  filtersScroll: { backgroundColor: WHITE, maxHeight: 52 },
  filtersWrap:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },

  list: { paddingHorizontal: 16, paddingTop: 16 },

  addAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: ORANGE, borderRadius: 14,
    paddingVertical: 13, marginBottom: 16,
    shadowColor: ORANGE, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  addAllText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  emptyWrap:    { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIconWrap:{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#FFF0ED", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyIcon:    { fontSize: 52, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: "700", color: BLACK, marginBottom: 8, textAlign: "center" },
  emptySub:     { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  browseBtn:    { backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText:{ color: WHITE, fontSize: 15, fontWeight: "700" },
  showAll:      { fontSize: 14, color: ORANGE, fontWeight: "600", marginTop: 8 },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: WHITE, borderRadius: 20, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: "hidden",
  },
  imageWrap: { width: "100%", height: 180, position: "relative" },
  image:     { width: "100%", height: "100%" },
  tag: {
    position: "absolute", top: 10, left: 10,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText:  { color: WHITE, fontSize: 10, fontWeight: "700" },
  heartBtn: {
    position: "absolute", top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
  },
  info:    { padding: 14 },
  topRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  family:  { fontSize: 11, fontWeight: "700", color: ORANGE, textTransform: "uppercase", letterSpacing: 0.5 },
  savedAt: { fontSize: 11, color: MUTED },
  name:    { fontSize: 16, fontWeight: "800", color: BLACK, marginBottom: 4 },
  desc:    { fontSize: 13, color: MUTED, lineHeight: 18, marginBottom: 12 },
  footer:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price:   { fontSize: 18, fontWeight: "800", color: ORANGE },
  cartBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: ORANGE, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  cartBtnText: { color: WHITE, fontSize: 13, fontWeight: "700" },
});

const pill = StyleSheet.create({
  wrap:       { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: LIGHT_BG },
  wrapActive: { backgroundColor: ORANGE },
  text:       { fontSize: 13, fontWeight: "600", color: MUTED },
  textActive: { color: WHITE },
});

const toast = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 32, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: BLACK, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 11,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  text: { color: WHITE, fontSize: 13, fontWeight: "600" },
});
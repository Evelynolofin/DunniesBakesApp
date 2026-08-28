import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { cartStore, CartProduct } from "@/constants/Cartstore";
import CheckoutScreen from "@/components/Checkout";
import { wishlistStore } from "@/constants/Wishliststore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, ALL_PRODUCTS } from "@/constants/Products";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ORANGE = "#F6410B";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";

type CartItem = Product & { quantity: number };

function tagColor(tag: string) {
  switch (tag) {
    case "Popular": return "#F6410B";
    case "Spicy":   return "#E53935";
    case "New":     return "#43A047";
    case "Local":   return "#8D6E63";
    default:        return ORANGE;
  }
}

function ConflictModal({
  visible,
  message,
  onReplace,
  onCancel,
}: {
  visible: boolean;
  message: string;
  onReplace: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent   
    >
      <Pressable style={conflict.backdrop} onPress={onCancel} />
      <View style={conflict.box}>
        <Text style={conflict.title}>Start new order?</Text>
        <Text style={conflict.body}>{message}</Text>
        <View style={conflict.row}>
          <TouchableOpacity style={conflict.cancelBtn} onPress={onCancel}>
            <Text style={conflict.cancelText}>Keep cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={conflict.replaceBtn} onPress={onReplace}>
            <Text style={conflict.replaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CartSheet({
  visible, cart, onClose, onIncrease, onDecrease, onRemove, onCheckout,
}: {
  visible: boolean; cart: CartItem[]; onClose: () => void;
  onIncrease: (id: string) => void; onDecrease: (id: string) => void;
  onRemove: (id: string) => void; onCheckout: () => void;
}) {
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent 
      onRequestClose={onClose}
    >
      <Pressable style={sheet.backdrop} onPress={onClose} />
      <View style={[sheet.container, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Your Cart</Text>
        {cart.length === 0 ? (
          <View style={sheet.empty}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={sheet.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.id} style={sheet.row}>
                <Image source={item.image} style={sheet.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={sheet.itemName}>{item.name}</Text>
                  <Text style={sheet.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
                <View style={sheet.qtyRow}>
                  <TouchableOpacity style={sheet.qtyBtn} onPress={() => onDecrease(item.id)}>
                    <Ionicons name="remove" size={16} color={ORANGE} />
                  </TouchableOpacity>
                  <Text style={sheet.qtyNum}>{item.quantity}</Text>
                  <TouchableOpacity style={sheet.qtyBtn} onPress={() => onIncrease(item.id)}>
                    <Ionicons name="add" size={16} color={ORANGE} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onRemove(item.id)} style={{ paddingLeft: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#CCC" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={sheet.totalRow}>
              <Text style={sheet.totalLabel}>Total</Text>
              <Text style={sheet.totalAmount}>₦{total.toLocaleString()}</Text>
            </View>
          </ScrollView>
        )}
        {cart.length > 0 && (
          <TouchableOpacity style={sheet.checkoutBtn} onPress={onCheckout}>
            <Text style={sheet.checkoutText}>Checkout · ₦{total.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

function ProductCard({
  item, cartItem, onAdd, onIncrease, onDecrease,
}: {
  item: Product; cartItem?: CartItem;
  onAdd: (item: Product) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
}) {
  const [wishlisted, setWishlisted] = React.useState(false);
 
  React.useEffect(() => {
    wishlistStore.isWishlisted(item.id).then(setWishlisted);
  }, [item.id]);
 
  async function toggleWishlist() {
    const action = await wishlistStore.toggle(item);
    setWishlisted(action === "added");
  }
 
  return (
    <View style={card.wrap}>
      <View style={card.imageWrap}>
        <Image source={item.image} style={card.image} resizeMode="cover" />
        {item.tag && (
          <View style={[card.tag, { backgroundColor: tagColor(item.tag) }]}>
            <Text style={card.tagText}>{item.tag}</Text>
          </View>
        )}
        <TouchableOpacity style={card.heartBtn} onPress={toggleWishlist} activeOpacity={0.8}>
          <Ionicons
            name={wishlisted ? "heart" : "heart-outline"}
            size={14}
            color={wishlisted ? ORANGE : "#CCC"}
          />
        </TouchableOpacity>
      </View>
      <View style={card.info}>
        <Text style={card.name} numberOfLines={1}>{item.name}</Text>
        <Text style={card.desc} numberOfLines={2}>{item.description}</Text>
        <View style={card.footer}>
          <Text style={card.price}>₦{item.price.toLocaleString()}</Text>
          {cartItem ? (
            <View style={card.qtyControl}>
              <TouchableOpacity style={card.qtyBtn} onPress={() => onDecrease(item.id)}>
                <Ionicons name="remove" size={14} color={WHITE} />
              </TouchableOpacity>
              <Text style={card.qtyNum}>{cartItem.quantity}</Text>
              <TouchableOpacity style={card.qtyBtn} onPress={() => onIncrease(item.id)}>
                <Ionicons name="add" size={14} color={WHITE} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={card.addBtn} onPress={() => onAdd(item)}>
              <Ionicons name="add" size={16} color={WHITE} />
              <Text style={card.addText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const { category, highlight } = useLocalSearchParams<{ category: string; highlight: string }>();

  const resolvedFamily = Array.isArray(highlight) ? highlight[0] : highlight ?? "";
  const resolvedCategory = Array.isArray(category) ? category[0] : category ?? "food";

  const [searchQuery, setSearchQuery] = useState("");
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible,   setCheckoutVisible]   = useState(false);
  const [cart, setCart] = useState<CartProduct[]>(() => cartStore.getItems());

  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [conflictMsg,    setConflictMsg]    = useState("");
  const insets = useSafeAreaInsets();

  const sync = useCallback(() => setCart(cartStore.getItems()), []);

  useEffect(() => {
    cartStore.load();         
    cartStore.addListener(sync);
    return () => cartStore.removeListener(sync);
  }, [sync]);
  
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const displayed = useMemo(() => {
    const byFamily = ALL_PRODUCTS.filter((p) => p.family === resolvedFamily);
    if (!searchQuery.trim()) return byFamily;
    return byFamily.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resolvedFamily, searchQuery]);

  const handleAdd = (item: Product) => {
      const result = cartStore.tryAdd(item);
  
      if (result === "added") return;
  
      const scope = cartStore.getCartScope()!;
      if (result === "wrong_family") {
        setConflictMsg(
          `Your cart has items from "${scope.family}". Adding "${item.name}" will remove them.`
        );
      } else {
        setConflictMsg(
          `Your cart has items from the "${scope.category}" section. Adding "${item.name}" will clear your cart.`
        );
      }
      setPendingProduct(item);
    };
  
    const confirmReplace = () => {
      if (pendingProduct) {
        cartStore.replaceAndAdd(pendingProduct);
      }
      setPendingProduct(null);
      setConflictMsg("");
    };
  
    const cancelReplace = () => {
      setPendingProduct(null);
      setConflictMsg("");
    };

    const handleCheckout = () => {
      setCartVisible(false);
      setTimeout(() => setCheckoutVisible(true));
    };
  
    const getCartItem = (id: string) => cart.find((i) => i.id === id);
  
  return (
    <View style={styles.root}>
      <StatusBar 
        translucent={Platform.OS === 'ios'} 
        backgroundColor={Platform.OS === 'android' ? WHITE : 'transparent'} 
        barStyle="dark-content" 
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{resolvedFamily}</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartVisible(true)}>
          <Ionicons name="bag-sharp" size={22} color={WHITE} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${resolvedFamily}...`}
          placeholderTextColor="#BBB"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#CCC" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {displayed.length > 0 ? (
          displayed.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              cartItem={getCartItem(item.id)}
              onAdd={handleAdd}
              onIncrease={(id) => cartStore.increase(id)}
              onDecrease={(id) => cartStore.decrease(id)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🍽️</Text>
            <Text style={styles.emptyTitle}>Nothing found</Text>
            <Text style={styles.emptySub}>Try a different search</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {totalItems > 0 && (
        <TouchableOpacity  style={[styles.floatingCart, { bottom: Math.max(insets.bottom + 12, 24) }]} onPress={() => setCartVisible(true)}>
          <View style={styles.floatingLeft}>
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.floatingLabel}>View Cart</Text>
          </View>
          <Text style={styles.floatingTotal}>
            ₦{cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}

      <CartSheet
        visible={cartVisible}
        cart={cart}
        onClose={() => setCartVisible(false)}
        onIncrease={(id) => cartStore.increase(id)}
        onDecrease={(id) => cartStore.decrease(id)}
        onRemove={(id) => cartStore.remove(id)}
        onCheckout={handleCheckout}
      />

      <ConflictModal
        visible={!!pendingProduct}
        message={conflictMsg}
        onReplace={confirmReplace}
        onCancel={cancelReplace}
      />

      {checkoutVisible && (
        <View style={StyleSheet.absoluteFillObject}>
          <CheckoutScreen onClose={() => setCheckoutVisible(false)} />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: WHITE, paddingTop: 50

  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK, flex: 1, textAlign: "center" },
  cartBtn: {
    backgroundColor: ORANGE, width: 42, height: 42,
    borderRadius: 13, alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4, backgroundColor: BLACK,
    width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: WHITE,
    marginHorizontal: 20, marginVertical: 12, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: BLACK },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: BLACK, marginTop: 12 },
  emptySub: { fontSize: 14, color: "#999", marginTop: 4 },
  floatingCart: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    backgroundColor: ORANGE, borderRadius: 16, paddingHorizontal: 20,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", shadowColor: ORANGE,
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,marginBottom: 15
  },
  floatingLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  floatingBadge: {
    backgroundColor: WHITE, width: 26, height: 26,
    borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  floatingBadgeText: { color: ORANGE, fontSize: 13, fontWeight: "700" },
  floatingLabel: { color: WHITE, fontSize: 15, fontWeight: "700" },
  floatingTotal: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

const card = StyleSheet.create({
  wrap: {
    flexDirection: "row", backgroundColor: WHITE, borderRadius: 18,
    marginBottom: 14, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { width: 110, height: 110 },
  image: { width: "100%", height: "100%" },
  tag: { position: "absolute", top: 8, left: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { color: WHITE, fontSize: 10, fontWeight: "700" },
  info: { flex: 1, padding: 12, justifyContent: "space-between" },
  name: { fontSize: 15, fontWeight: "700", color: BLACK },
  desc: { fontSize: 12, color: "#999", lineHeight: 17, marginTop: 2 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  price: { fontSize: 15, fontWeight: "700", color: ORANGE },
  addBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: ORANGE,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 2,
  },
  heartBtn: {
    position: "absolute", top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  addText: { color: WHITE, fontSize: 13, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: ORANGE, borderRadius: 10, overflow: "hidden" },
  qtyBtn: { padding: 6, paddingHorizontal: 8 },
  qtyNum: { color: WHITE, fontSize: 14, fontWeight: "700", paddingHorizontal: 4 },
});

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  container: {
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "75%",
  },
  handle: { width: 40, height: 4, backgroundColor: "#EEE", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  title: { fontSize: 20, fontWeight: "700", color: BLACK, marginBottom: 16 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  itemName: { fontSize: 14, fontWeight: "600", color: BLACK },
  itemPrice: { fontSize: 13, color: ORANGE, fontWeight: "700", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1.5,
    borderColor: ORANGE, alignItems: "center", justifyContent: "center",
  },
  qtyNum: { fontSize: 14, fontWeight: "700", color: BLACK, minWidth: 20, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: BLACK },
  totalAmount: { fontSize: 16, fontWeight: "700", color: ORANGE },
  checkoutBtn: { backgroundColor: ORANGE, borderRadius: 100, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  checkoutText: { color: WHITE, fontSize: 16, fontWeight: "700" },
});

const conflict = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  box: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28,
  },
  title: { fontSize: 18, fontWeight: "700", color: BLACK, marginBottom: 10 },
  body:  { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 24 },
  row:   { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#DDD", alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: BLACK },
  replaceBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: ORANGE, alignItems: "center",
  },
  replaceText: { fontSize: 15, fontWeight: "700", color: WHITE },
});
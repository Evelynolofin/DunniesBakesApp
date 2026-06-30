import { Ionicons } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { cartStore, CartProduct } from "@/constants/Cartstore";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { orderStore } from "@/constants/OrderStore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = "#F6410B";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER = "#EEEEEE";
const MUTED = "#999999";
const SUCCESS = "#22C55E";

const HOME: Href = "/(tabs)/home";
const PRODUCTS: Href = "/products"; 
const ORDERS: Href = "/(tabs)/order";

type DeliveryMethod = "delivery" | "pickup";
type PaymentMethod  = "card" | "transfer" | "cash";

type DeliveryForm = {
  fullName: string;
  phone:    string;
  email:    string;
  address:  string;
  city:     string;
  state:    string;
  landmark: string;
  note:     string;
};

type CardForm = {
  number: string;
  expiry: string;
  cvv:    string;
  name:   string;
};

function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const DELIVERY_FEE  = 800;
const PLATFORM_FEE  = 150;

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={sub.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={sub.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={sub.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, maxLength, multiline, editable = true,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; maxLength?: number;
  multiline?: boolean; editable?: boolean;
}) {
  return (
    <View style={sub.fieldWrap}>
      <Text style={sub.fieldLabel}>{label}</Text>
      <TextInput
        style={[sub.fieldInput, multiline && { height: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#BBBBBB"
        keyboardType={keyboardType ?? "default"}
        maxLength={maxLength}
        multiline={multiline}
        editable={editable}
        autoCorrect={false}
      />
    </View>
  );
}

function RadioRow({
  selected, onPress, icon, label, sub: subLabel,
}: {
  selected: boolean; onPress: () => void; icon: string; label: string; sub?: string;
}) {
  return (
    <TouchableOpacity
      style={[opt.row, selected && opt.rowActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={opt.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[opt.label, selected && opt.labelActive]}>{label}</Text>
        {subLabel ? <Text style={opt.sub}>{subLabel}</Text> : null}
      </View>
      <View style={[opt.radio, selected && opt.radioActive]}>
        {selected && <View style={opt.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

function SuccessModal({ visible, total, onDone }: { visible: boolean; total: number; onDone: () => void }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[success.backdrop, { opacity }]}>
        <Animated.View style={[success.card, { transform: [{ scale }] }]}>
          <View style={success.iconWrap}>
            <Ionicons name="checkmark" size={36} color={WHITE} />
          </View>
          <Text style={success.title}>Order Placed! 🎉</Text>
          <Text style={success.body}>
            Your order of{" "}
            <Text style={{ fontWeight: "700", color: ORANGE }}>₦{total.toLocaleString()}</Text>{" "}
            has been received. You'll get a confirmation shortly.
          </Text>
          <View style={success.refWrap}>
            <Text style={success.refLabel}>Order reference</Text>
            <Text style={success.refVal}>#{Math.random().toString(36).slice(2, 10).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={success.btn} onPress={onDone}>
            <Text style={success.btnText}>Go to Order</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const handleBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(PRODUCTS); 
  }
};

export default function CheckoutScreen({ onClose }: { onClose?: () => void }) {
  const [cart, setCart] = useState<CartProduct[]>(() => cartStore.getItems());
  const insets = useSafeAreaInsets();
  
  const sync = useCallback(() => setCart(cartStore.getItems()), []);
  useEffect(() => {
    cartStore.addListener(sync);
    return () => cartStore.removeListener(sync);
  }, [sync]);

 useEffect(() => {
  const loadUser = async () => {
    try {
      const email = await AsyncStorage.getItem("currentUserEmail");

      if (!email) return;

      const fullName =
        (await AsyncStorage.getItem(`fullName_${email}`)) ?? "";

      const phone =
        (await AsyncStorage.getItem(`phone_${email}`)) ?? "";

      const address =
        (await AsyncStorage.getItem(`address_${email}`)) ?? "";

      const city =
        (await AsyncStorage.getItem(`city_${email}`)) ?? "";

      const state =
        (await AsyncStorage.getItem(`state_${email}`)) ?? "";

      setForm((prev) => ({
        ...prev,
        fullName,
        phone,
        email,
        address,
        city,
        state,
      }));
    } catch (error) {
      console.log("Failed to load user:", error);
    }
  };

  loadUser();
}, []);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod>("transfer");
  const [successVisible, setSuccessVisible] = useState(false);
  const [errors,         setErrors]         = useState<Partial<DeliveryForm & CardForm>>({});
  const [paidAmount, setPaidAmount] = useState(0);

  const subtotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total       = subtotal + deliveryFee + PLATFORM_FEE;

  const [form, setForm] = useState<DeliveryForm>({
    fullName: "", phone: "", email: "",
    address: "", city: "", state: "", landmark: "", note: "",
  });

  const [cardForm, setCardForm] = useState<CardForm>({
    number: "", expiry: "", cvv: "", name: "",
  });

  function setField<T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    key: keyof T,
    val: string,
  ) {
    setter((prev) => ({ ...prev, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 11)
      e.phone = "Enter a valid phone number";
    if (!form.email.trim() || !form.email.includes("@"))
      e.email = "Enter a valid email";
    if (deliveryMethod === "delivery") {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim())    e.city    = "Required";
      if (!form.state.trim())   e.state   = "Required";
    }
    if (paymentMethod === "card") {
      if (cardForm.number.replace(/\s/g, "").length < 16) e.number = "Enter a valid card number";
      if (cardForm.expiry.length < 5)  e.expiry = "Enter expiry (MM/YY)";
      if (cardForm.cvv.length < 3)     e.cvv    = "Enter CVV";
      if (!cardForm.name.trim())       e.name   = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function placeOrder() {
  if (!validate()) return;
 
  const newOrder = {
    id: Date.now().toString(),
    reference: Math.random().toString(36).slice(2, 10).toUpperCase(),
    placedAt: new Date().toISOString(),
    status: "confirmed" as const,
    items: cart.map((item) => ({
      id:       item.id,
      name:     item.name,
      family:   item.family,
      price:    item.price,
      quantity: item.quantity,
      image:    item.image,
    })),
    subtotal,
    deliveryFee,
    platformFee: PLATFORM_FEE,
    total,
    deliveryMethod,
    paymentMethod,
    fullName: form.fullName,
    phone:    form.phone,
    email:    form.email,
    address:  form.address  || undefined,
    city:     form.city     || undefined,
    state:    form.state    || undefined,
    note:     form.note     || undefined,
  };
 
  orderStore.save(newOrder);
  orderStore.autoAdvance(newOrder.id, deliveryMethod, newOrder.reference);
  setPaidAmount(total);
  setSuccessVisible(true);
  cartStore.clear();
}
 

  function onDone() {
    setSuccessVisible(false);
    router.replace(ORDERS);
  }

  if (cart.length === 0 && !successVisible) {
    return (
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onClose?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 56 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace("/products")}>
            <Text style={styles.emptyBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
       <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onClose?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.card}>
            <SectionHeader title="Order Summary" subtitle={`${cart.length} item${cart.length > 1 ? "s" : ""}`} />
            {cart.map((item) => (
              <View key={item.id} style={styles.orderRow}>
                <Image source={item.image} style={styles.orderThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.orderFamily}>{item.family}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.orderPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                  <Text style={styles.orderQty}>× {item.quantity}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
                style={styles.editCartBtn}
                activeOpacity={0.7}
                onPress={() => {
                    onClose?.();
                }}
                >
                <Ionicons name="create-outline" size={14} color={ORANGE} />
                <Text style={styles.editCartText}>Edit cart</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Delivery Method" />
            <RadioRow
              selected={deliveryMethod === "delivery"}
              onPress={() => setDeliveryMethod("delivery")}
              icon="🚚"
              label="Home Delivery"
              sub={`+₦${DELIVERY_FEE.toLocaleString()} · Estimated 30–50 min`}
            />
            <RadioRow
              selected={deliveryMethod === "pickup"}
              onPress={() => setDeliveryMethod("pickup")}
              icon="🏪"
              label="Self Pickup"
              sub="Ready in 15–20 min · No delivery fee"
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Your Details" subtitle="We'll use this to reach you" />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field
                label="Full Name *"
                value={form.fullName}
                onChange={(v) => setField(setForm, "fullName", v)}
                editable={false}
                />
                {errors.fullName ? <Text style={styles.errText}>{errors.fullName}</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Phone *"
                  value={form.phone}
                  onChange={(v) => setField(setForm, "phone", v.replace(/[^\d+\s-]/g, ""))}
                  placeholder="080xxxxxxxx"
                  keyboardType="phone-pad"
                  maxLength={14}
                />
                {errors.phone ? <Text style={styles.errText}>{errors.phone}</Text> : null}
              </View>
            </View>

            <Field
              label="Email *"
              value={form.email}
              onChange={(v) => setField(setForm, "email", v)}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}

            {deliveryMethod === "delivery" && (
              <>
                <Field
                  label="Delivery Address *"
                  value={form.address}
                  onChange={(v) => setField(setForm, "address", v)}
                  placeholder="House number, street name"
                />
                {errors.address ? <Text style={styles.errText}>{errors.address}</Text> : null}

                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="City *"
                      value={form.city}
                      onChange={(v) => setField(setForm, "city", v)}
                      placeholder="Jos"
                    />
                    {errors.city ? <Text style={styles.errText}>{errors.city}</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="State *"
                      value={form.state}
                      onChange={(v) => setField(setForm, "state", v)}
                      placeholder="Plateau"
                    />
                    {errors.state ? <Text style={styles.errText}>{errors.state}</Text> : null}
                  </View>
                </View>

                <Field
                  label="Landmark (optional)"
                  value={form.landmark}
                  onChange={(v) => setField(setForm, "landmark", v)}
                  placeholder="Near a mosque, beside NNPC filling station…"
                />
              </>
            )}

            <Field
              label="Order Note (optional)"
              value={form.note}
              onChange={(v) => setField(setForm, "note", v)}
              placeholder="Any special instructions for your order?"
              multiline
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Payment" subtitle="All transactions are secure" />

            <RadioRow
              selected={paymentMethod === "transfer"}
              onPress={() => setPaymentMethod("transfer")}
              icon="🏦"
              label="Bank Transfer"
              sub="Transfer to our account after placing order"
            />
            <RadioRow
              selected={paymentMethod === "card"}
              onPress={() => setPaymentMethod("card")}
              icon="💳"
              label="Debit / Credit Card"
              sub="Visa, Mastercard, Verve"
            />
            <RadioRow
              selected={paymentMethod === "cash"}
              onPress={() => setPaymentMethod("cash")}
              icon="💵"
              label="Cash on Delivery"
              sub={deliveryMethod === "pickup" ? "Pay at pickup" : "Pay when order arrives"}
            />

            {paymentMethod === "card" && (
              <View style={styles.cardForm}>
                <View style={styles.cardFormHeader}>
                  <Ionicons name="card" size={18} color={ORANGE} />
                  <Text style={styles.cardFormTitle}>Card Details</Text>
                </View>
                <Field
                  label="Card Number"
                  value={cardForm.number}
                  onChange={(v) => setField(setCardForm, "number", formatCard(v))}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="number-pad"
                  maxLength={19}
                />
                {errors.number ? <Text style={styles.errText}>{errors.number}</Text> : null}
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Expiry (MM/YY)"
                      value={cardForm.expiry}
                      onChange={(v) => setField(setCardForm, "expiry", formatExpiry(v))}
                      placeholder="MM/YY"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    {errors.expiry ? <Text style={styles.errText}>{errors.expiry}</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="CVV"
                      value={cardForm.cvv}
                      onChange={(v) => setField(setCardForm, "cvv", v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                    {errors.cvv ? <Text style={styles.errText}>{errors.cvv}</Text> : null}
                  </View>
                </View>
                <Field
                  label="Name on Card"
                  value={cardForm.name}
                  onChange={(v) => setField(setCardForm, "name", v)}
                  placeholder="As it appears on card"
                />
                {errors.name ? <Text style={styles.errText}>{errors.name}</Text> : null}
              </View>
            )}

            {paymentMethod === "transfer" && (
              <View style={styles.transferBox}>
                <Text style={styles.transferTitle}>Transfer Instructions</Text>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Bank</Text>
                  <Text style={styles.transferVal}>First Bank Nigeria</Text>
                </View>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Account Name</Text>
                  <Text style={styles.transferVal}>Chop Chop Restaurant</Text>
                </View>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Account Number</Text>
                  <Text style={[styles.transferVal, { color: ORANGE, fontWeight: "700" }]}>3012345678</Text>
                </View>
                <Text style={styles.transferNote}>
                  Use your phone number as the transfer narration. Your order is confirmed once payment is verified.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Price Breakdown" />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceVal}>₦{subtotal.toLocaleString()}</Text>
            </View>
            {deliveryMethod === "delivery" && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery fee</Text>
                <Text style={styles.priceVal}>₦{DELIVERY_FEE.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.priceVal}>₦{PLATFORM_FEE.toLocaleString()}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalVal}>₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.ctaTop}>
            <Text style={styles.ctaTotalLabel}>Total</Text>
            <Text style={styles.ctaTotal}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={placeOrder} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={18} color={WHITE} />
            <Text style={styles.ctaBtnText}>
              {paymentMethod === "card" ? "Pay Now" : "Place Order"}
            </Text>
          </TouchableOpacity>
        </View>

        <SuccessModal
            visible={successVisible}
            total={paidAmount}
            onDone={onDone}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 40, paddingBottom: 14,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn:     { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK },

  card: {
    backgroundColor: WHITE, marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  orderRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  orderThumb: { width: 52, height: 52, borderRadius: 12 },
  orderName:  { fontSize: 14, fontWeight: "600", color: BLACK },
  orderFamily:{ fontSize: 12, color: MUTED, marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: "700", color: ORANGE },
  orderQty:   { fontSize: 12, color: MUTED, marginTop: 2 },
  editCartBtn:{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 12 },
  editCartText:{ fontSize: 13, color: ORANGE, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 12 },

  errText: { fontSize: 11, color: "#E53935", marginTop: -8, marginBottom: 6, marginLeft: 2 },

  cardForm:       { marginTop: 14, backgroundColor: LIGHT_BG, borderRadius: 16, padding: 16 },
  cardFormHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  cardFormTitle:  { fontSize: 14, fontWeight: "700", color: BLACK },

  transferBox:   { marginTop: 14, backgroundColor: "#FFF7F5", borderRadius: 16, borderWidth: 1, borderColor: "#FFD5CA", padding: 16 },
  transferTitle: { fontSize: 14, fontWeight: "700", color: BLACK, marginBottom: 12 },
  transferRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  transferLabel: { fontSize: 13, color: MUTED },
  transferVal:   { fontSize: 13, color: BLACK, fontWeight: "600" },
  transferNote:  { fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 18 },

  priceRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  priceLabel:      { fontSize: 14, color: MUTED },
  priceVal:        { fontSize: 14, color: BLACK, fontWeight: "500" },
  priceDivider:    { height: 1, backgroundColor: BORDER, marginVertical: 8 },
  priceTotalLabel: { fontSize: 16, fontWeight: "700", color: BLACK },
  priceTotalVal:   { fontSize: 16, fontWeight: "700", color: ORANGE },

  cta: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, paddingHorizontal: 20, paddingTop: 14,
     paddingBottom: 18,
    borderTopWidth: 1, borderTopColor: BORDER,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  ctaTop:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  ctaTotalLabel: { fontSize: 14, color: MUTED },
  ctaTotal:      { fontSize: 16, fontWeight: "700", color: BLACK },
  ctaBtn: {
    backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaBtnText: { color: WHITE, fontSize: 16, fontWeight: "700" },

  emptyWrap:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: "700", color: BLACK },
  emptyBtn:     { backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  emptyBtnText: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

const sub = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sectionNum:    { width: 30, height: 30, borderRadius: 10, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center" },
  sectionNumText:{ color: WHITE, fontSize: 14, fontWeight: "700" },
  sectionTitle:  { fontSize: 16, fontWeight: "700", color: BLACK },
  sectionSub:    { fontSize: 12, color: MUTED, marginTop: 1 },
  fieldWrap:     { marginBottom: 12 },
  fieldLabel:    { fontSize: 12, fontWeight: "600", color: BLACK, marginBottom: 6 },
  fieldInput:    { backgroundColor: LIGHT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: BLACK, borderWidth: 1, borderColor: BORDER },
});

const opt = StyleSheet.create({
  row:         { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 10, backgroundColor: WHITE },
  rowActive:   { borderColor: ORANGE, backgroundColor: "#FFF7F5" },
  icon:        { fontSize: 22 },
  label:       { fontSize: 14, fontWeight: "600", color: BLACK },
  labelActive: { color: ORANGE },
  sub:         { fontSize: 12, color: MUTED, marginTop: 2 },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: ORANGE },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
});

const success = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card:     { backgroundColor: WHITE, borderRadius: 28, padding: 32, width: "100%", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: SUCCESS, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:    { fontSize: 22, fontWeight: "700", color: BLACK, marginBottom: 10 },
  body:     { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  refWrap:  { backgroundColor: LIGHT_BG, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center", width: "100%", marginBottom: 24 },
  refLabel: { fontSize: 11, color: MUTED, marginBottom: 4 },
  refVal:   { fontSize: 18, fontWeight: "700", color: BLACK, letterSpacing: 1 },
  btn:      { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: "100%", alignItems: "center" },
  btnText:  { color: WHITE, fontSize: 15, fontWeight: "700" },
});
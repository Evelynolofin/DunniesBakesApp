import { CartProduct, cartStore } from "@/constants/Cartstore";
import {
  notifyOrderPayment,
  notifyOrderPlaced,
} from "@/constants/Notificationservice";
import { orderStore } from "@/constants/OrderStore";
import { verifyPaystackTransaction } from "@/constants/Paystack";
import { recordOrderPayment } from "@/constants/Transactionstore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePaystack } from "react-native-paystack-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ORANGE = "#F6410B";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER = "#EEEEEE";
const MUTED = "#999999";
const SUCCESS = "#22C55E";
const DANGER = "#E53935";

const HOME: Href = "/(tabs)/home";
const PRODUCTS: Href = "/products";
const ORDERS: Href = "/(tabs)/order";

type DeliveryMethod = "delivery" | "pickup";
type PaymentMethod = "wallet" | "paystack" | "transfer" | "cash";

type DeliveryForm = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  landmark: string;
  note: string;
};

type FormErrors = Partial<DeliveryForm> & {
  wallet?: string;
  paystack?: string;
};

const DELIVERY_FEE = 800;
const PLATFORM_FEE = 150;

function generateReference(prefix: string) {
  console.log("[generateReference] called with prefix:", prefix);
  const ref = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  console.log("[generateReference] generated:", ref);
  return ref;
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  console.log("[SectionHeader] render", { title, subtitle });
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
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  maxLength,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  maxLength?: number;
  multiline?: boolean;
  editable?: boolean;
}) {
  console.log("[Field] render", { label, value, editable });
  return (
    <View style={sub.fieldWrap}>
      <Text style={sub.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          sub.fieldInput,
          multiline && { height: 80, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={(v) => {
          console.log(`[Field:${label}] onChangeText`, v);
          onChange(v);
        }}
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
  selected,
  onPress,
  icon,
  label,
  sub: subLabel,
  subColor,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  sub?: string;
  subColor?: string;
  disabled?: boolean;
}) {
  console.log("[RadioRow] render", { label, selected, disabled });
  return (
    <TouchableOpacity
      style={[opt.row, selected && opt.rowActive, disabled && { opacity: 0.5 }]}
      onPress={() => {
        console.log(`[RadioRow:${label}] pressed`);
        onPress();
      }}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={opt.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[opt.label, selected && opt.labelActive]}>{label}</Text>
        {subLabel ? (
          <Text style={[opt.sub, subColor ? { color: subColor } : null]}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      <View style={[opt.radio, selected && opt.radioActive]}>
        {selected && <View style={opt.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

function SuccessModal({
  visible,
  total,
  onDone,
}: {
  visible: boolean;
  total: number;
  onDone: () => void;
}) {
  console.log("[SuccessModal] render", { visible, total });
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[SuccessModal] visibility effect fired, visible =", visible);
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => console.log("[SuccessModal] entrance animation complete"));
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
            <Text style={{ fontWeight: "700", color: ORANGE }}>
              ₦{total.toLocaleString()}
            </Text>{" "}
            has been received. You'll get a confirmation shortly.
          </Text>
          <View style={success.refWrap}>
            <Text style={success.refLabel}>Order reference</Text>
            <Text style={success.refVal}>
              #{Math.random().toString(36).slice(2, 10).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={success.btn}
            onPress={() => {
              console.log("[SuccessModal] 'Go to Order' pressed");
              onDone();
            }}
          >
            <Text style={success.btnText}>Go to Order</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const handleBack = () => {
  console.log("[handleBack] called, canGoBack:", router.canGoBack());
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(PRODUCTS);
  }
};

export default function CheckoutScreen({
  onClose = () => router.back(),
}: {
  onClose?: () => void;
}) {
  console.log("[CheckoutScreen] render start");

  const [cart, setCart] = useState<CartProduct[]>(() => {
    const items = cartStore.getItems();
    console.log("[CheckoutScreen] initial cart from cartStore:", items);
    return items;
  });
  const insets = useSafeAreaInsets();
  const { popup } = usePaystack();

  const orderPlacedRef = useRef(false);

  const sync = useCallback(() => {
    const items = cartStore.getItems();
    console.log("[CheckoutScreen] cartStore sync fired, items:", items);
    setCart(items);
  }, []);
  useEffect(() => {
    console.log("[CheckoutScreen] mounting cartStore listener");
    cartStore.addListener(sync);
    return () => {
      console.log("[CheckoutScreen] removing cartStore listener");
      cartStore.removeListener(sync);
    };
  }, [sync]);

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      console.log("[loadUser] start");
      try {
        const email = await AsyncStorage.getItem("currentUserEmail");
        console.log("[loadUser] currentUserEmail:", email);

        if (!email) {
          console.log("[loadUser] no email found, aborting");
          return;
        }

        setEmail(email);

        const fullName =
          (await AsyncStorage.getItem(`fullName_${email}`)) ?? "";
        console.log("[loadUser] fullName:", fullName);

        const phone = (await AsyncStorage.getItem(`phone_${email}`)) ?? "";
        console.log("[loadUser] phone:", phone);

        const address = (await AsyncStorage.getItem(`address_${email}`)) ?? "";
        console.log("[loadUser] address:", address);

        const city = (await AsyncStorage.getItem(`city_${email}`)) ?? "";
        console.log("[loadUser] city:", city);

        const state = (await AsyncStorage.getItem(`state_${email}`)) ?? "";
        console.log("[loadUser] state:", state);

        setForm((prev) => {
          const next = {
            ...prev,
            fullName,
            phone,
            email,
            address,
            city,
            state,
          };
          console.log("[loadUser] setForm ->", next);
          return next;
        });
      } catch (error) {
        console.log("[loadUser] Failed to load user:", error);
      }
    };

    loadUser();
  }, []);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [paystackProcessing, setPaystackProcessing] = useState(false);

  useEffect(() => {
    console.log("[CheckoutScreen] wallet balance effect fired, email:", email);
    if (!email) return;
    (async () => {
      const saved = await AsyncStorage.getItem(`wallet_balance_${email}`);
      console.log("[CheckoutScreen] wallet_balance from storage:", saved);
      setWalletBalance(saved ? Number(saved) : 0);
    })();
  }, [email]);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [successVisible, setSuccessVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [paidAmount, setPaidAmount] = useState(0);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee + PLATFORM_FEE;
  console.log("[CheckoutScreen] computed totals", {
    subtotal,
    deliveryFee,
    total,
    deliveryMethod,
    paymentMethod,
  });

  const [form, setForm] = useState<DeliveryForm>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    landmark: "",
    note: "",
  });

  function setField<T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    key: keyof T,
    val: string,
  ) {
    console.log("[setField] key:", key, "val:", val);
    setter((prev) => ({ ...prev, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    console.log(
      "[validate] running validation, form:",
      form,
      "deliveryMethod:",
      deliveryMethod,
      "paymentMethod:",
      paymentMethod,
    );
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 11)
      e.phone = "Enter a valid phone number";
    if (!form.email.trim() || !form.email.includes("@"))
      e.email = "Enter a valid email";
    if (deliveryMethod === "delivery") {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.state.trim()) e.state = "Required";
    }
    if (paymentMethod === "wallet" && walletBalance < total) {
      e.wallet = "Insufficient wallet balance for this order";
    }
    console.log("[validate] errors found:", e);
    setErrors(e);
    const isValid = Object.keys(e).length === 0;
    console.log("[validate] result:", isValid);
    return isValid;
  }

  async function debitWallet(amt: number) {
    console.log("[debitWallet] start", { amt, email });
    if (!email) {
      console.log("[debitWallet] no email, aborting");
      return;
    }
    const nextBalance = walletBalance - amt;
    console.log("[debitWallet] nextBalance:", nextBalance);

    await AsyncStorage.setItem(`wallet_balance_${email}`, String(nextBalance));
    setWalletBalance(nextBalance);
    console.log("[debitWallet] balance updated");
  }

  function finalizeOrder(reference?: string) {
    if (orderPlacedRef.current) {
      console.log(
        "[finalizeOrder] ignored — an order was already placed this session",
        { reference },
      );
      return;
    }
    orderPlacedRef.current = true;
    console.log("[finalizeOrder] start", { reference });
    const newOrder = {
      id: Date.now().toString(),
      reference:
        reference ?? Math.random().toString(36).slice(2, 10).toUpperCase(),
      placedAt: new Date().toISOString(),
      status: "confirmed" as const,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        family: item.family,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      subtotal,
      deliveryFee,
      platformFee: PLATFORM_FEE,
      total,
      deliveryMethod,
      paymentMethod,
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      note: form.note || undefined,
    };
    console.log("[finalizeOrder] newOrder:", newOrder);

    orderStore.save(newOrder);
    console.log("[finalizeOrder] orderStore.save complete");
    orderStore.autoAdvance(newOrder.id, deliveryMethod, newOrder.reference);
    console.log("[finalizeOrder] orderStore.autoAdvance complete");

    notifyOrderPlaced(newOrder.reference);
    console.log("[finalizeOrder] notifyOrderPlaced complete");

    if (email) {
      recordOrderPayment(email, {
        method: paymentMethod,
        amount: total,
        reference: newOrder.reference,
        orderRef: newOrder.reference,
      }).catch((e) =>
        console.log("[finalizeOrder] recordOrderPayment failed", e),
      );
    } else {
      console.log(
        "[finalizeOrder] no email — skipping transaction history (guest checkout)",
      );
    }
    notifyOrderPayment(
      paymentMethod,
      total,
      newOrder.reference,
      newOrder.reference,
    );
    console.log("[finalizeOrder] notifyOrderPayment complete");

    setPaidAmount(total);
    setSuccessVisible(true);
    console.log(
      "[finalizeOrder] success modal shown, cart clear deferred to onDone",
    );
  }

  async function placeOrder() {
    console.log("[placeOrder] start, paymentMethod:", paymentMethod);
    if (orderPlacedRef.current) {
      console.log("[placeOrder] ignored — order already placed this session");
      return;
    }
    if (!validate()) {
      console.log("[placeOrder] validation failed, aborting");
      return;
    }

    if (paymentMethod === "wallet") {
      console.log("[placeOrder] wallet flow starting");
      setWalletProcessing(true);
      try {
        const reference = generateReference("ORDER_WALLET");
        console.log("[placeOrder] wallet reference:", reference);
        await debitWallet(total);
        finalizeOrder(reference);
      } catch (error) {
        console.log("[placeOrder] ❌ Wallet debit error", error);
        setErrors({
          wallet: "Couldn't complete wallet payment. Please try again.",
        });
      } finally {
        setWalletProcessing(false);
        console.log("[placeOrder] wallet flow finished");
      }
      return;
    }

    if (paymentMethod === "paystack") {
      console.log("[placeOrder] paystack flow starting");
      const reference = generateReference("ORDER");
      console.log("[placeOrder] paystack reference:", reference);

      popup.checkout({
        email: form.email,
        amount: total,
        reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Purpose",
              variable_name: "purpose",
              value: "order_payment",
            },
          ],
        },
        onSuccess: async () => {
          console.log("[placeOrder:paystack] onSuccess fired");
          setPaystackProcessing(true);
          try {
            const verified = await verifyPaystackTransaction(reference);
            console.log("[placeOrder:paystack] verification result:", verified);

            if (
              verified &&
              verified.status === "success" &&
              verified.reference === reference &&
              verified.amountKobo === total * 100
            ) {
              console.log(
                "[placeOrder:paystack] verification passed, finalizing order",
              );
              finalizeOrder(reference);
            } else {
              console.log("[placeOrder:paystack] verification failed checks");
              setErrors({
                paystack:
                  "We couldn't verify this payment. Contact support with reference " +
                  reference,
              });
            }
          } catch (error) {
            console.log("[placeOrder:paystack] ❌ Verification error", error);
            setErrors({
              paystack:
                "Payment verification failed. Contact support with reference " +
                reference,
            });
          } finally {
            setPaystackProcessing(false);
            console.log("[placeOrder:paystack] processing finished");
          }
        },
        onCancel: () => {
          console.log(
            "[placeOrder:paystack] onCancel fired - user closed checkout",
          );
        },
        onError: (err: any) => {
          console.log("[placeOrder:paystack] ❌ onError fired", err);
          setErrors({ paystack: "Payment failed. Please try again." });
        },
      });
      return;
    }

    console.log(
      "[placeOrder] non-wallet/non-paystack flow (transfer/cash), finalizing directly",
    );
    finalizeOrder();
  }

  function onDone() {
    console.log("[onDone] called, clearing cart and navigating to ORDERS");
    setSuccessVisible(false);
    cartStore.clear();
    router.replace(ORDERS);
  }

  const isProcessing = walletProcessing || paystackProcessing;
  console.log("[CheckoutScreen] isProcessing:", isProcessing);

  if (cart.length === 0 && !successVisible) {
    console.log("[CheckoutScreen] rendering empty cart state");
    return (
      <View style={styles.root}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              console.log("[CheckoutScreen] empty-state back pressed");
              onClose?.();
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 56 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => {
              console.log("[CheckoutScreen] 'Browse Menu' pressed");
              router.replace("/products");
            }}
          >
            <Text style={styles.emptyBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  console.log("[CheckoutScreen] rendering main checkout UI");
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              console.log("[CheckoutScreen] main back pressed");
              onClose?.();
            }}
            style={styles.backBtn}
          >
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
            <SectionHeader
              title="Order Summary"
              subtitle={`${cart.length} item${cart.length > 1 ? "s" : ""}`}
            />
            {cart.map((item) => (
              <View key={item.id} style={styles.orderRow}>
                <Image source={item.image} style={styles.orderThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.orderFamily}>{item.family}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.orderPrice}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                  <Text style={styles.orderQty}>× {item.quantity}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.editCartBtn}
              activeOpacity={0.7}
              onPress={() => {
                console.log("[CheckoutScreen] 'Edit cart' pressed");
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
              onPress={() => {
                console.log("[CheckoutScreen] deliveryMethod -> delivery");
                setDeliveryMethod("delivery");
              }}
              icon="🚚"
              label="Home Delivery"
              sub={`+₦${DELIVERY_FEE.toLocaleString()} · Estimated 30–50 min`}
            />
            <RadioRow
              selected={deliveryMethod === "pickup"}
              onPress={() => {
                console.log("[CheckoutScreen] deliveryMethod -> pickup");
                setDeliveryMethod("pickup");
              }}
              icon="🏪"
              label="Self Pickup"
              sub="Ready in 15–20 min · No delivery fee"
            />
          </View>

          <View style={styles.card}>
            <SectionHeader
              title="Your Details"
              subtitle="We'll use this to reach you"
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Full Name *"
                  value={form.fullName}
                  onChange={(v) => setField(setForm, "fullName", v)}
                  editable={false}
                />
                {errors.fullName ? (
                  <Text style={styles.errText}>{errors.fullName}</Text>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Phone *"
                  value={form.phone}
                  onChange={(v) =>
                    setField(setForm, "phone", v.replace(/[^\d+\s-]/g, ""))
                  }
                  placeholder="080xxxxxxxx"
                  keyboardType="phone-pad"
                  maxLength={14}
                />
                {errors.phone ? (
                  <Text style={styles.errText}>{errors.phone}</Text>
                ) : null}
              </View>
            </View>

            <Field
              label="Email *"
              value={form.email}
              onChange={(v) => setField(setForm, "email", v)}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            {errors.email ? (
              <Text style={styles.errText}>{errors.email}</Text>
            ) : null}

            {deliveryMethod === "delivery" && (
              <>
                <Field
                  label="Delivery Address *"
                  value={form.address}
                  onChange={(v) => setField(setForm, "address", v)}
                  placeholder="House number, street name"
                />
                {errors.address ? (
                  <Text style={styles.errText}>{errors.address}</Text>
                ) : null}

                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="City *"
                      value={form.city}
                      onChange={(v) => setField(setForm, "city", v)}
                      placeholder="Jos"
                    />
                    {errors.city ? (
                      <Text style={styles.errText}>{errors.city}</Text>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="State *"
                      value={form.state}
                      onChange={(v) => setField(setForm, "state", v)}
                      placeholder="Plateau"
                    />
                    {errors.state ? (
                      <Text style={styles.errText}>{errors.state}</Text>
                    ) : null}
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
            <SectionHeader
              title="Payment"
              subtitle="All transactions are secure"
            />

            <RadioRow
              selected={paymentMethod === "wallet"}
              onPress={() => {
                console.log("[CheckoutScreen] paymentMethod -> wallet");
                setPaymentMethod("wallet");
              }}
              icon="👛"
              label="Pay with Wallet"
              sub={
                email
                  ? `Balance: ₦${walletBalance.toLocaleString()}${walletBalance < total ? " · Insufficient balance" : ""}`
                  : "Log in to use your wallet"
              }
              subColor={walletBalance < total ? DANGER : undefined}
              disabled={!email}
            />
            <RadioRow
              selected={paymentMethod === "paystack"}
              onPress={() => {
                console.log("[CheckoutScreen] paymentMethod -> paystack");
                setPaymentMethod("paystack");
              }}
              icon="💳"
              label="Pay with Paystack"
              sub="Card, Bank, USSD & Transfer"
            />
            <RadioRow
              selected={paymentMethod === "transfer"}
              onPress={() => {
                console.log("[CheckoutScreen] paymentMethod -> transfer");
                setPaymentMethod("transfer");
              }}
              icon="🏦"
              label="Bank Transfer"
              sub="Transfer to our account after placing order"
            />
            <RadioRow
              selected={paymentMethod === "cash"}
              onPress={() => {
                console.log("[CheckoutScreen] paymentMethod -> cash");
                setPaymentMethod("cash");
              }}
              icon="💵"
              label="Cash on Delivery"
              sub={
                deliveryMethod === "pickup"
                  ? "Pay at pickup"
                  : "Pay when order arrives"
              }
            />

            {paymentMethod === "wallet" && (
              <View style={styles.walletBox}>
                <View style={styles.walletBoxRow}>
                  <Ionicons name="wallet-outline" size={18} color={ORANGE} />
                  <Text style={styles.walletBoxTitle}>Wallet Balance</Text>
                </View>
                <Text style={styles.walletBoxAmount}>
                  ₦{walletBalance.toLocaleString()}
                </Text>
                {walletBalance < total ? (
                  <Text style={styles.walletBoxWarning}>
                    Your balance is short by ₦
                    {(total - walletBalance).toLocaleString()}. Top up your
                    wallet before paying with it.
                  </Text>
                ) : (
                  <Text style={styles.walletBoxHint}>
                    ₦{total.toLocaleString()} will be deducted from your wallet
                    when you place this order.
                  </Text>
                )}
              </View>
            )}
            {errors.wallet ? (
              <Text style={styles.errText}>{errors.wallet}</Text>
            ) : null}

            {paymentMethod === "paystack" && (
              <View style={styles.paystackBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={MUTED}
                />
                <Text style={styles.paystackBadgeText}>
                  Secured by Paystack · Card, Bank, USSD & Transfer
                </Text>
              </View>
            )}
            {errors.paystack ? (
              <Text style={styles.errText}>{errors.paystack}</Text>
            ) : null}

            {paymentMethod === "transfer" && (
              <View style={styles.transferBox}>
                <Text style={styles.transferTitle}>Transfer Instructions</Text>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Bank</Text>
                  <Text style={styles.transferVal}>Opay Microfinance Bank</Text>
                </View>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Account Name</Text>
                  <Text style={styles.transferVal}>Dunnies Kitchen</Text>
                </View>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Account Number</Text>
                  <Text
                    style={[
                      styles.transferVal,
                      { color: ORANGE, fontWeight: "700" },
                    ]}
                  >
                    8152625413
                  </Text>
                </View>
                <Text style={styles.transferNote}>
                  Use your phone number as the transfer narration. Your order is
                  confirmed once payment is verified.
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
                <Text style={styles.priceVal}>
                  ₦{DELIVERY_FEE.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.priceVal}>
                ₦{PLATFORM_FEE.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalVal}>
                ₦{total.toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 18) }]}
        >
          <View style={styles.ctaTop}>
            <Text style={styles.ctaTotalLabel}>Total</Text>
            <Text style={styles.ctaTotal}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.ctaBtn, isProcessing && { opacity: 0.6 }]}
            onPress={() => {
              console.log("[CheckoutScreen] CTA 'Place Order' pressed");
              placeOrder();
            }}
            activeOpacity={0.85}
            disabled={isProcessing}
          >
            <Ionicons name="shield-checkmark" size={18} color={WHITE} />
            <Text style={styles.ctaBtnText}>
              {walletProcessing
                ? "Processing…"
                : paystackProcessing
                  ? "Verifying payment…"
                  : paymentMethod === "paystack"
                    ? "Pay with Paystack"
                    : paymentMethod === "wallet"
                      ? "Pay with Wallet"
                      : "Place Order"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK },

  card: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  orderThumb: { width: 52, height: 52, borderRadius: 12 },
  orderName: { fontSize: 14, fontWeight: "600", color: BLACK },
  orderFamily: { fontSize: 12, color: MUTED, marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: "700", color: ORANGE },
  orderQty: { fontSize: 12, color: MUTED, marginTop: 2 },
  editCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: 12,
  },
  editCartText: { fontSize: 13, color: ORANGE, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 12 },

  errText: {
    fontSize: 11,
    color: DANGER,
    marginTop: -4,
    marginBottom: 6,
    marginLeft: 2,
  },

  walletBox: {
    marginTop: 14,
    backgroundColor: "#FFF7F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD5CA",
    padding: 16,
  },
  walletBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  walletBoxTitle: { fontSize: 13, fontWeight: "700", color: BLACK },
  walletBoxAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: ORANGE,
    marginBottom: 8,
  },
  walletBoxHint: { fontSize: 12, color: MUTED, lineHeight: 18 },
  walletBoxWarning: {
    fontSize: 12,
    color: DANGER,
    lineHeight: 18,
    fontWeight: "600",
  },

  paystackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIGHT_BG,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 14,
  },
  paystackBadgeText: { fontSize: 11, color: MUTED, flexShrink: 1 },

  transferBox: {
    marginTop: 14,
    backgroundColor: "#FFF7F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD5CA",
    padding: 16,
  },
  transferTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 12,
  },
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transferLabel: { fontSize: 13, color: MUTED },
  transferVal: { fontSize: 13, color: BLACK, fontWeight: "600" },
  transferNote: { fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 18 },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, color: MUTED },
  priceVal: { fontSize: 14, color: BLACK, fontWeight: "500" },
  priceDivider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },
  priceTotalLabel: { fontSize: 16, fontWeight: "700", color: BLACK },
  priceTotalVal: { fontSize: 16, fontWeight: "700", color: ORANGE },

  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  ctaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ctaTotalLabel: { fontSize: 14, color: MUTED },
  ctaTotal: { fontSize: 16, fontWeight: "700", color: BLACK },
  ctaBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnText: { color: WHITE, fontSize: 16, fontWeight: "700" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: BLACK },
  emptyBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  emptyBtnText: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

const sub = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionNum: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumText: { color: WHITE, fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: BLACK },
  sectionSub: { fontSize: 12, color: MUTED, marginTop: 1 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BLACK,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: LIGHT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
  },
});

const opt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 10,
    backgroundColor: WHITE,
  },
  rowActive: { borderColor: ORANGE, backgroundColor: "#FFF7F5" },
  icon: { fontSize: 22 },
  label: { fontSize: 14, fontWeight: "600", color: BLACK },
  labelActive: { color: ORANGE },
  sub: { fontSize: 12, color: MUTED, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: ORANGE },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
});

const success = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: SUCCESS,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "700", color: BLACK, marginBottom: 10 },
  body: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  refWrap: {
    backgroundColor: LIGHT_BG,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  refLabel: { fontSize: 11, color: MUTED, marginBottom: 4 },
  refVal: { fontSize: 18, fontWeight: "700", color: BLACK, letterSpacing: 1 },
  btn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  btnText: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

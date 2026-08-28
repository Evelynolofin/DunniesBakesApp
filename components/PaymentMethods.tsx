import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";

export type PaymentMethodId = "wallet" | "paystack" | "transfer" | "cash";

function defaultMethodKey(email: string) {
  return `default_payment_method_${email}`;
}

const METHODS: {
  id: PaymentMethodId;
  icon: string;
  label: string;
  description: string;
}[] = [
  { id: "wallet",   icon: "wallet-outline",   label: "Wallet",          description: "Pay instantly from your in-app wallet balance" },
  { id: "paystack", icon: "card-outline",     label: "Paystack",        description: "Card, bank, or USSD via Paystack" },
  { id: "transfer", icon: "swap-horizontal-outline", label: "Bank Transfer", description: "Transfer to our account after placing your order" },
  { id: "cash",     icon: "cash-outline",     label: "Cash on Delivery", description: "Pay with cash when your order arrives" },
];

export default function PaymentMethodsScreen({ onClose = () => router.back() }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethodId>("transfer");

  const load = useCallback(async () => {
    const currentEmail = await AsyncStorage.getItem("currentUserEmail");
    if (!currentEmail) return;
    setEmail(currentEmail);

    const [balRaw, savedDefault] = await Promise.all([
      AsyncStorage.getItem(`wallet_balance_${currentEmail}`),
      AsyncStorage.getItem(defaultMethodKey(currentEmail)),
    ]);
    setWalletBalance(balRaw ? Number(balRaw) : 0);
    if (savedDefault) setDefaultMethod(savedDefault as PaymentMethodId);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chooseDefault = async (id: PaymentMethodId) => {
    setDefaultMethod(id);
    if (email) {
      await AsyncStorage.setItem(defaultMethodKey(email), id);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionLabel}>Available methods</Text>
        <Text style={styles.sectionSub}>
          Tap a method to set it as your default at checkout. You can still switch methods on any order.
        </Text>

        <View style={styles.list}>
          {METHODS.map((m) => {
            const active = defaultMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.row, active && styles.rowActive]}
                activeOpacity={0.8}
                onPress={() => {
                  if (m.id === "wallet" && !email) return;
                  chooseDefault(m.id);
                }}
              >
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <Ionicons name={m.icon as any} size={20} color={active ? WHITE : ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{m.label}</Text>
                  <Text style={styles.rowDesc}>
                    {m.id === "wallet"
                      ? email
                        ? `Balance: ₦${walletBalance.toLocaleString()}`
                        : "Log in to use your wallet"
                      : m.description}
                  </Text>
                </View>
                {active ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                ) : (
                  <View style={styles.radio} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK },

  sectionLabel: { fontSize: 15, fontWeight: "700", color: BLACK, marginHorizontal: 20, marginTop: 20 },
  sectionSub: { fontSize: 13, color: MUTED, marginHorizontal: 20, marginTop: 6, lineHeight: 18 },

  list: { marginHorizontal: 16, marginTop: 16 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: WHITE, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: BORDER,
  },
  rowActive: { borderColor: ORANGE, backgroundColor: "#FFF7F5" },

  iconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFF1EC",
    alignItems: "center", justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: ORANGE },

  rowLabel: { fontSize: 15, fontWeight: "700", color: BLACK },
  rowDesc: { fontSize: 12, color: MUTED, marginTop: 3 },

  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BORDER,
  },
  defaultBadge: { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },
});
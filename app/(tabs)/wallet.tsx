import { notifyWalletTopUp } from "@/constants/Notificationservice";
import { verifyPaystackTransaction } from "@/constants/Paystack";
import {
  addTransaction,
  getTransactions,
  Transaction,
  TxType,
} from "@/constants/Transactionstore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000];

type Mode = "topup";

function generateReference() {
  return `WALLET_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatMoney(n: number) {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function txIcon(tx: Transaction): { name: string; color: string; bg: string } {
  switch (tx.method) {
    case "paystack":
      return { name: "card-outline", color: "#3B82F6", bg: "#EAF1FF" };
    case "transfer":
      return {
        name: "swap-horizontal-outline",
        color: "#8B5CF6",
        bg: "#F1EBFC",
      };
    case "cash":
      return { name: "cash-outline", color: SUCCESS, bg: "#E9F9EF" };
    case "wallet":
    default:
      return tx.type === "credit"
        ? { name: "arrow-down", color: SUCCESS, bg: "#E9F9EF" }
        : { name: "arrow-up", color: ORANGE, bg: "#FFF1EC" };
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  maxLength?: number;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#BBBBBB"
        keyboardType={keyboardType ?? "default"}
        maxLength={maxLength}
        autoCorrect={false}
      />
    </View>
  );
}

function SuccessModal({
  visible,
  type,
  amount,
  onDone,
}: {
  visible: boolean;
  type: TxType;
  amount: number;
  onDone: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View style={[modalStyles.card, { transform: [{ scale }] }]}>
          <View
            style={[
              modalStyles.iconWrap,
              { backgroundColor: type === "credit" ? SUCCESS : ORANGE },
            ]}
          >
            <Ionicons
              name={type === "credit" ? "checkmark" : "arrow-up"}
              size={36}
              color={WHITE}
            />
          </View>
          <Text style={modalStyles.title}>
            {type === "credit" ? "Funds Added! 🎉" : "Payment Sent"}
          </Text>
          <Text style={modalStyles.body}>
            {type === "credit" ? (
              <>
                <Text style={{ fontWeight: "700", color: ORANGE }}>
                  {formatMoney(amount)}
                </Text>{" "}
                has been added to your wallet.
              </>
            ) : (
              <>
                You sent{" "}
                <Text style={{ fontWeight: "700", color: ORANGE }}>
                  {formatMoney(amount)}
                </Text>{" "}
                from your wallet.
              </>
            )}
          </Text>
          <TouchableOpacity style={modalStyles.btn} onPress={onDone}>
            <Text style={modalStyles.btnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function WalletScreen({ onClose }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const [mode, setMode] = useState<Mode>("topup");

  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpProcessing, setTopUpProcessing] = useState(false);
  const { popup } = usePaystack();

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [successType, setSuccessType] = useState<TxType>("credit");
  const [successAmount, setSuccessAmount] = useState(0);

  const storageKey = useCallback(
    (suffix: string) => `wallet_${suffix}_${email}`,
    [email],
  );

  useEffect(() => {
    (async () => {
      const currentEmail = await AsyncStorage.getItem("currentUserEmail");
      if (!currentEmail) {
        console.log("No logged in user found.");
        return;
      }
      setEmail(currentEmail);

      const savedBalance = await AsyncStorage.getItem(
        `wallet_balance_${currentEmail}`,
      );
      setBalance(savedBalance ? Number(savedBalance) : 0);

      const savedTx = await getTransactions(currentEmail);
      setTransactions(savedTx);
    })();
  }, []);

  function clearErrors() {
    setErrors({});
  }

  async function creditWallet(amt: number, reference: string) {
    if (!email) return;

    const nextBalance = balance + amt;
    await AsyncStorage.setItem(`wallet_balance_${email}`, String(nextBalance));
    setBalance(nextBalance);

    const item = await addTransaction(email, {
      type: "credit",
      method: "wallet",
      title: "Wallet top-up",
      subtitle: `Paystack · ${reference}`,
      amount: amt,
      reference,
    });
    setTransactions((prev) => [item, ...prev]);

    notifyWalletTopUp(amt, reference);

    setSuccessType("credit");
    setSuccessAmount(amt);
    setSuccessVisible(true);
    setTopUpAmount("");
  }

  async function handleAddFunds() {
    const amt = Number(topUpAmount.replace(/[^\d]/g, ""));
    if (!amt || amt < 100) {
      setErrors({ topUpAmount: "Enter a valid amount (min ₦100)" });
      return;
    }
    if (!email) {
      setErrors({
        topUpAmount: "Couldn't find your account email — please log in again",
      });
      return;
    }
    clearErrors();

    const reference = generateReference();

    popup.checkout({
      email,
      amount: amt,
      reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Purpose",
            variable_name: "purpose",
            value: "wallet_topup",
          },
        ],
      },
      onSuccess: async (res: any) => {
        setTopUpProcessing(true);
        try {
          const verified = await verifyPaystackTransaction(reference);

          if (
            verified &&
            verified.status === "success" &&
            verified.reference === reference &&
            verified.amountKobo === amt * 100
          ) {
            creditWallet(amt, reference);
          } else {
            setErrors({
              topUpAmount:
                "We couldn't verify this payment. Contact support with reference " +
                reference,
            });
          }
        } catch (error) {
          console.log("❌ Verification error", error);
          setErrors({
            topUpAmount:
              "Payment verification failed. Contact support with reference " +
              reference,
          });
        } finally {
          setTopUpProcessing(false);
        }
      },
      onCancel: () => {},
      onError: (err: any) => {
        console.log("❌ Paystack onError fired", err);
        setErrors({ topUpAmount: "Payment failed. Please try again." });
      },
    });
  }

  function onDone() {
    setSuccessVisible(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    clearErrors();
  }

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
            onPress={() => (onClose ? onClose() : router.back())}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <TouchableOpacity
                onPress={() => setBalanceHidden((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.85)"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceValue}>
              {balanceHidden ? "₦ • • • • • •" : formatMoney(balance)}
            </Text>
          </View>

          {/* Add Funds panel */}
          {mode === "topup" && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Add Funds</Text>
              <Text style={styles.sectionSub}>
                Top up your wallet to pay faster at checkout
              </Text>

              <Field
                label="Amount *"
                value={topUpAmount}
                onChange={(v) => setTopUpAmount(v.replace(/[^\d]/g, ""))}
                placeholder="0"
                keyboardType="number-pad"
              />
              {errors.topUpAmount ? (
                <Text style={styles.errText}>{errors.topUpAmount}</Text>
              ) : null}

              <View style={styles.chipRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.chip,
                      topUpAmount === String(amt) && styles.chipActive,
                    ]}
                    onPress={() => setTopUpAmount(String(amt))}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        topUpAmount === String(amt) && styles.chipTextActive,
                      ]}
                    >
                      {formatMoney(amt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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

              <TouchableOpacity
                style={[styles.primaryBtn, topUpProcessing && { opacity: 0.6 }]}
                onPress={handleAddFunds}
                activeOpacity={0.85}
                disabled={topUpProcessing}
              >
                <Ionicons name="lock-closed" size={16} color={WHITE} />
                <Text style={styles.primaryBtnText}>
                  {topUpProcessing ? "Verifying payment…" : "Pay with Paystack"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Transaction history */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transaction History</Text>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💳</Text>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your wallet activity will show up here
                </Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const icon = txIcon(tx);
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View
                      style={[styles.txIconWrap, { backgroundColor: icon.bg }]}
                    >
                      <Ionicons
                        name={icon.name as any}
                        size={16}
                        color={icon.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      {tx.subtitle ? (
                        <Text style={styles.txSub} numberOfLines={1}>
                          {tx.subtitle}
                        </Text>
                      ) : null}
                      <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.type === "credit" ? SUCCESS : DANGER },
                      ]}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <SuccessModal
          visible={successVisible}
          type={successType}
          amount={successAmount}
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
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK },

  balanceCard: {
    backgroundColor: ORANGE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 22,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  balanceValue: {
    color: WHITE,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  balanceActions: { flexDirection: "row", gap: 10 },
  balanceActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  balanceActionBtnActive: { backgroundColor: WHITE },
  balanceActionText: { color: WHITE, fontSize: 13, fontWeight: "700" },
  balanceActionTextActive: { color: ORANGE },

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
  sectionTitle: { fontSize: 16, fontWeight: "700", color: BLACK },
  sectionSub: { fontSize: 12, color: MUTED, marginTop: 2, marginBottom: 16 },

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
  errText: {
    fontSize: 11,
    color: DANGER,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 2,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: "#FFF1EC", borderColor: ORANGE },
  chipText: { fontSize: 13, fontWeight: "600", color: MUTED },
  chipTextActive: { color: ORANGE },

  radioRow: {
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
  radioRowActive: { borderColor: ORANGE, backgroundColor: "#FFF7F5" },
  radioIcon: { fontSize: 20 },
  radioLabel: { fontSize: 14, fontWeight: "600", color: BLACK },
  radioLabelActive: { color: ORANGE },
  radioSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  radioDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDotWrapActive: { borderColor: ORANGE },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },

  balanceHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  balanceHintText: { fontSize: 12, color: MUTED },

  paystackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIGHT_BG,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  paystackBadgeText: { fontSize: 11, color: MUTED, flexShrink: 1 },

  primaryBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  primaryBtnText: { color: WHITE, fontSize: 15, fontWeight: "700" },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { fontSize: 14, fontWeight: "600", color: BLACK },
  txSub: { fontSize: 12, color: MUTED, marginTop: 1 },
  txDate: { fontSize: 11, color: "#BBBBBB", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },

  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 4,
  },
  emptySubtitle: { fontSize: 12, color: MUTED, textAlign: "center" },
});

const modalStyles = StyleSheet.create({
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

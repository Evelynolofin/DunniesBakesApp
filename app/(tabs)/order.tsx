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
  Modal,
  Pressable,
} from "react-native";
import { orderStore, Order, OrderStatus } from "@/constants/OrderStore";

const ORANGE  = "#F6410B";
const BLACK   = "#1A1A1A";
const WHITE   = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER  = "#EEEEEE";
const MUTED   = "#999999";
const SUCCESS = "#22C55E";
const BLUE    = "#3B82F6";
const AMBER   = "#F59E0B";

type StatusConfig = {
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  confirmed: {
    label: "Order Confirmed",
    icon: "checkmark-circle",
    color: BLUE,
    bg: "#EFF6FF",
    description: "We've received your order and are getting started.",
  },
  preparing: {
    label: "Preparing",
    icon: "flame",
    color: AMBER,
    bg: "#FFFBEB",
    description: "Your food is being freshly prepared.",
  },
  ready: {
    label: "Ready",
    icon: "bag-check",
    color: SUCCESS,
    bg: "#F0FDF4",
    description: "Your order is ready and waiting.",
  },
  on_the_way: {
    label: "On the Way",
    icon: "bicycle",
    color: ORANGE,
    bg: "#FFF7F5",
    description: "Your rider is heading to you now.",
  },
  delivered: {
    label: "Delivered",
    icon: "checkmark-done-circle",
    color: SUCCESS,
    bg: "#F0FDF4",
    description: "Enjoy your meal! 🎉",
  },
  cancelled: {
    label: "Cancelled",
    icon: "close-circle",
    color: "#EF4444",
    bg: "#FEF2F2",
    description: "This order was cancelled.",
  },
};


const DELIVERY_STEPS: OrderStatus[] = [
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
];

const PICKUP_STEPS: OrderStatus[] = [
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

function stepIndex(steps: OrderStatus[], status: OrderStatus) {
  const i = steps.indexOf(status);
  return i === -1 ? 0 : i;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function OrderTimeline({
  status,
  deliveryMethod,
}: {
  status: OrderStatus;
  deliveryMethod: "delivery" | "pickup";
}) {
  if (status === "cancelled") {
    return (
      <View style={timeline.cancelWrap}>
        <Ionicons name="close-circle" size={20} color="#EF4444" />
        <Text style={timeline.cancelText}>This order was cancelled.</Text>
      </View>
    );
  }

  const steps = deliveryMethod === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const current = stepIndex(steps, status);

  return (
    <View style={timeline.wrap}>
      {steps.map((step, i) => {
        const cfg = STATUS_CONFIG[step];
        const done = i <= current;
        const isLast = i === steps.length - 1;

        return (
          <View key={step} style={timeline.row}>
            <View style={timeline.dotCol}>
              <View
                style={[
                  timeline.dot,
                  done && { backgroundColor: cfg.color, borderColor: cfg.color },
                  i === current && timeline.dotActive,
                ]}
              >
                {done && (
                  <Ionicons
                    name={i === current ? (cfg.icon as any) : "checkmark"}
                    size={10}
                    color={WHITE}
                  />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    timeline.line,
                    i < current && { backgroundColor: cfg.color },
                  ]}
                />
              )}
            </View>

            <View style={timeline.labelCol}>
              <Text
                style={[
                  timeline.stepLabel,
                  done && { color: BLACK, fontWeight: "600" },
                  i === current && { color: cfg.color },
                ]}
              >
                {cfg.label}
              </Text>
              {i === current && (
                <Text style={timeline.stepDesc}>{cfg.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status];

  return (
    <Modal
      visible={!!order}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={detail.backdrop} onPress={onClose} />
      <View style={detail.sheet}>
        <View style={detail.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={detail.header}>
            <View style={detail.headerLeft}>
              <Text style={card.ref}>Order ID: #{order.reference}</Text>
              <Text style={detail.date}>{formatDate(order.placedAt)}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          <View style={detail.section}>
            <Text style={detail.sectionTitle}>Order Progress</Text>
            <OrderTimeline
              status={order.status}
              deliveryMethod={order.deliveryMethod}
            />
          </View>

          <View style={detail.section}>
            <Text style={detail.sectionTitle}>
              Items ({order.items.length})
            </Text>
            {order.items.map((item) => (
              <View key={item.id} style={detail.itemRow}>
                <Image source={item.image} style={detail.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={detail.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={detail.itemFamily}>{item.family}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={detail.itemPrice}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                  <Text style={detail.itemQty}>× {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={detail.section}>
            <Text style={detail.sectionTitle}>Delivery Details</Text>
            <View style={detail.infoRow}>
              <Text style={detail.infoLabel}>Method</Text>
              <Text style={detail.infoVal}>
                {order.deliveryMethod === "delivery"
                  ? "🚚 Home Delivery"
                  : "🏪 Self Pickup"}
              </Text>
            </View>
            <View style={detail.infoRow}>
              <Text style={detail.infoLabel}>Payment</Text>
              <Text style={detail.infoVal}>
                {order.paymentMethod === "card"
                  ? "💳 Card"
                  : order.paymentMethod === "transfer"
                  ? "🏦 Bank Transfer"
                  : "💵 Cash"}
              </Text>
            </View>
            {order.address ? (
              <View style={detail.infoRow}>
                <Text style={detail.infoLabel}>Address</Text>
                <Text style={[detail.infoVal, { flex: 1, textAlign: "right" }]}>
                  {order.address}
                  {order.city ? `, ${order.city}` : ""}
                  {order.state ? `, ${order.state}` : ""}
                </Text>
              </View>
            ) : null}
            <View style={detail.infoRow}>
              <Text style={detail.infoLabel}>Contact</Text>
              <Text style={detail.infoVal}>{order.phone}</Text>
            </View>
            {order.note ? (
              <View style={detail.infoRow}>
                <Text style={detail.infoLabel}>Note</Text>
                <Text style={[detail.infoVal, { flex: 1, textAlign: "right", color: MUTED }]}>
                  {order.note}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={detail.section}>
            <Text style={detail.sectionTitle}>Price Breakdown</Text>
            <View style={detail.priceRow}>
              <Text style={detail.priceLabel}>Subtotal</Text>
              <Text style={detail.priceVal}>
                ₦{order.subtotal.toLocaleString()}
              </Text>
            </View>
            {order.deliveryFee > 0 && (
              <View style={detail.priceRow}>
                <Text style={detail.priceLabel}>Delivery fee</Text>
                <Text style={detail.priceVal}>
                  ₦{order.deliveryFee.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={detail.priceRow}>
              <Text style={detail.priceLabel}>Platform fee</Text>
              <Text style={detail.priceVal}>
                ₦{order.platformFee.toLocaleString()}
              </Text>
            </View>
            <View style={detail.divider} />
            <View style={detail.priceRow}>
              <Text style={detail.totalLabel}>Total</Text>
              <Text style={detail.totalVal}>
                ₦{order.total.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const previewItems = order.items.slice(0, 3);
  const remaining = order.items.length - 3;

  return (
    <TouchableOpacity
      style={card.wrap}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={card.top}>
        <View>
          <Text style={card.ref}>#{order.reference}</Text>
          <Text style={card.time}>{timeAgo(order.placedAt)}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={card.thumbRow}>
        {previewItems.map((item) => (
          <Image key={item.id} source={item.image} style={card.thumb} />
        ))}
        {remaining > 0 && (
          <View style={card.moreWrap}>
            <Text style={card.moreText}>+{remaining}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={card.total}>₦{order.total.toLocaleString()}</Text>
      </View>

      <Text style={card.names} numberOfLines={1}>
        {order.items.map((i) => i.name).join(" · ")}
      </Text>

      {order.status !== "delivered" && order.status !== "cancelled" && (
        <View style={card.progressTrack}>
          <View
            style={[
              card.progressFill,
              {
                backgroundColor: cfg.color,
                width: `${
                  ((stepIndex(
                    order.deliveryMethod === "pickup"
                      ? PICKUP_STEPS
                      : DELIVERY_STEPS,
                    order.status
                  ) +
                    1) /
                    4) *
                  100
                }%` as any,
              },
            ]}
          />
        </View>
      )}

      <View style={card.footer}>
        <Text style={card.footerMeta}>
          {order.deliveryMethod === "delivery" ? "🚚 Delivery" : "🏪 Pickup"} ·{" "}
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </Text>
        <View style={card.viewBtn}>
          <Text style={card.viewText}>View details</Text>
          <Ionicons name="chevron-forward" size={12} color={ORANGE} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

type FilterTab = "all" | "active" | "delivered" | "cancelled";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "active",    label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersScreen() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [filter, setFilter]       = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    const all = await orderStore.getAll();
    setOrders(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    orderStore.addListener(load);
    return () => orderStore.removeListener(load);
  }, [load]);

  const filtered = orders.filter((o) => {
    if (filter === "all")       return true;
    if (filter === "active")    return !["delivered", "cancelled"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const activeCount = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {activeCount > 0 && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{activeCount} active</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsWrap}
        style={styles.tabsScroll}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, filter === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Loading orders…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>
            {filter === "active" ? "🍳" : filter === "cancelled" ? "❌" : "🛍️"}
          </Text>
          <Text style={styles.emptyTitle}>
            {filter === "all"
              ? "No orders yet"
              : filter === "active"
              ? "No active orders"
              : filter === "delivered"
              ? "No delivered orders"
              : "No cancelled orders"}
          </Text>
          <Text style={styles.emptySub}>
            {filter === "all"
              ? "Your order history will appear here."
              : "Switch tabs to see other orders."}
          </Text>
          {filter === "all" && (
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => setSelectedId(order.id)}
            />
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <OrderDetailModal
        order={selected}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 54,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle:    { fontSize: 22, fontWeight: "800", color: BLACK, flex: 1 },
  activePill:     { backgroundColor: "#FFF0ED", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activePillText: { fontSize: 12, fontWeight: "700", color: ORANGE },

  tabsScroll: { backgroundColor: WHITE, maxHeight: 52 },
  tabsWrap: {
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
    },
  tab:        { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: LIGHT_BG },
  tabActive:  { backgroundColor: ORANGE },
  tabText:    { fontSize: 13, fontWeight: "600", color: MUTED },
  tabTextActive: { color: WHITE },

  list: { paddingHorizontal: 16, paddingTop: 14 },

  emptyWrap:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: BLACK, marginBottom: 6 },
  emptySub:   { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },
  browseBtn:  { marginTop: 20, backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: WHITE, borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  top:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  ref:       { fontSize: 15, fontWeight: "700", color: BLACK },
  time:      { fontSize: 12, color: MUTED, marginTop: 2 },
  thumbRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  thumb:     { width: 44, height: 44, borderRadius: 10 },
  moreWrap:  { width: 44, height: 44, borderRadius: 10, backgroundColor: LIGHT_BG, alignItems: "center", justifyContent: "center" },
  moreText:  { fontSize: 13, fontWeight: "700", color: MUTED },
  total:     { fontSize: 16, fontWeight: "800", color: ORANGE },
  names:     { fontSize: 12, color: MUTED, marginBottom: 10 },
  progressTrack: { height: 3, backgroundColor: BORDER, borderRadius: 2, marginBottom: 10 },
  progressFill:  { height: 3, borderRadius: 2 },
  footer:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerMeta:{ fontSize: 12, color: MUTED },
  viewBtn:   { flexDirection: "row", alignItems: "center", gap: 2 },
  viewText:  { fontSize: 12, color: ORANGE, fontWeight: "600" },
});

const badge = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: "700" },
});

const timeline = StyleSheet.create({
  wrap:        { paddingTop: 4 },
  row:         { flexDirection: "row", gap: 12 },
  dotCol:      { alignItems: "center", width: 20, paddingHorizontal:15 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BORDER,
    backgroundColor: WHITE,
    alignItems: "center", justifyContent: "center",
  },
  dotActive:   { transform: [{ scale: 1.2 }] },
  line:        { width: 2, flex: 1, backgroundColor: BORDER, minHeight: 24, marginVertical: 2 },
  labelCol:    { flex: 1, paddingBottom: 16 },
  stepLabel:   { fontSize: 14, color: MUTED, fontWeight: "500" },
  stepDesc:    { fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 18 },
  cancelWrap:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#FEF2F2", borderRadius: 12 },
  cancelText:  { fontSize: 14, color: "#EF4444", fontWeight: "600" },
});

const detail = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "90%",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 20, 
  },
  handle:      { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerLeft:  {},
  ref:         { fontSize: 18, fontWeight: "800", color: BLACK },
  date:        { fontSize: 12, color: MUTED, marginTop: 3 },
  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 14, fontWeight: "700", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, color: MUTED },
  itemRow:     { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  thumb:       { width: 48, height: 48, borderRadius: 10 },
  itemName:    { fontSize: 14, fontWeight: "600", color: BLACK },
  itemFamily:  { fontSize: 12, color: MUTED, marginTop: 2 },
  itemPrice:   { fontSize: 14, fontWeight: "700", color: ORANGE },
  itemQty:     { fontSize: 12, color: MUTED, marginTop: 2 },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  infoLabel:   { fontSize: 13, color: MUTED },
  infoVal:     { fontSize: 13, color: BLACK, fontWeight: "600" },
  priceRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  priceLabel:  { fontSize: 14, color: MUTED },
  priceVal:    { fontSize: 14, color: BLACK, fontWeight: "500" },
  divider:     { height: 1, backgroundColor: BORDER, marginVertical: 8 },
  totalLabel:  { fontSize: 16, fontWeight: "700", color: BLACK },
  totalVal:    { fontSize: 16, fontWeight: "700", color: ORANGE },
});
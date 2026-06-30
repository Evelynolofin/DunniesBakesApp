import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import {
  AppNotification,
  getStoredNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
  clearAllNotifications,
  requestNotificationPermission,
} from "@/constants/Notificationservice";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";
const RED      = "#EF4444";
const GREEN    = "#22C55E";
const BLUE     = "#3B82F6";
const AMBER    = "#F59E0B";

const TYPE_CONFIG: Record<
  AppNotification["type"],
  { icon: string; color: string; label: string }
> = {
  order:  { icon: "receipt-outline",        color: ORANGE, label: "Order"   },
  promo:  { icon: "pricetag-outline",        color: AMBER,  label: "Promo"   },
  auth:   { icon: "person-circle-outline",   color: BLUE,   label: "Account" },
  system: { icon: "information-circle-outline", color: MUTED, label: "System" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NotifCard({
  item,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      {!item.read && <View style={styles.unreadDot} />}

      <View style={[styles.iconBox, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.timestamp)}</Text>
        </View>
        <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.cardBody2} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onDelete}
      >
        <Ionicons name="close" size={16} color={MUTED} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconRing}>
        <Ionicons name="notifications-off-outline" size={44} color={ORANGE} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySub}>
        Order updates, promos and account alerts will show up here.
      </Text>
    </View>
  );
}

type Filter = "all" | AppNotification["type"];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",    label: "All"     },
  { id: "order",  label: "Orders"  },
  { id: "promo",  label: "Promos"  },
  { id: "auth",   label: "Account" },
];

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.filterTab}
    >
      <Text
        style={[
          styles.filterTabText,
          active && styles.filterTabTextActive,
        ]}
      >
        {label}
      </Text>

      {active && <View style={styles.filterIndicator} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter]               = useState<Filter>("all");
  const [refreshing, setRefreshing]       = useState(false);
  const [permGranted, setPermGranted]     = useState(true);

  const load = useCallback(async () => {
    const list = await getStoredNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    load();
    requestNotificationPermission().then(setPermGranted);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = useCallback(async (item: AppNotification) => {
    await markOneRead(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.type === "order" || item.data?.screen === "order") {
      router.push("/(tabs)/order" as any);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert("Clear All", "Remove all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearAllNotifications();
          setNotifications([]);
        },
      },
    ]);
  }, []);

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleMarkAllRead}>
              <Text style={styles.headerBtnText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={18} color={RED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!permGranted && (
        <TouchableOpacity
          style={styles.permBanner}
          onPress={() => requestNotificationPermission().then(setPermGranted)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-off" size={18} color={WHITE} />
          <Text style={styles.permText}>
            Enable notifications to get order updates
          </Text>
          <Ionicons name="chevron-forward" size={16} color={WHITE} />
        </TouchableOpacity>
      )}

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <FilterTab
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filtered.length === 0 ? styles.emptyScroll : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ORANGE}
            colors={[ORANGE]}
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((item) => (
            <NotifCard
              key={item.id}
              item={item}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerTitle:   { fontSize: 22, fontWeight: "800", color: BLACK },
  headerSub:     { fontSize: 12, color: ORANGE, fontWeight: "600", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerBtn:     { paddingHorizontal: 6, paddingVertical: 4 },
  headerBtnText: { fontSize: 13, fontWeight: "600", color: ORANGE },

  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permText: { flex: 1, color: WHITE, fontSize: 13, fontWeight: "600" },

  filterContainer: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    position: "relative",
  },

  filterTabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#777",
  },

  filterTabTextActive: {
    color: BLACK,
    fontWeight: "700",
  },

  filterIndicator: {
    position: "absolute",
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  emptyScroll: { flex: 1 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 36,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTopRow:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  timeText:  { fontSize: 11, color: MUTED, marginLeft: "auto" },

  cardTitle:       { fontSize: 14, fontWeight: "600", color: BLACK, marginBottom: 3 },
  cardTitleUnread: { fontWeight: "800" },
  cardBody2:       { fontSize: 13, color: MUTED, lineHeight: 18 },

  deleteBtn: { paddingTop: 2 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF0ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: BLACK, marginBottom: 8, textAlign: "center" },
  emptySub:   { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },
});
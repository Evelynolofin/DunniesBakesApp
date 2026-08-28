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
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getPoints,
  getPointsHistory,
  pointsToNaira,
  LoyaltyEntry,
  LOYALTY_EARN_THRESHOLD,
  LOYALTY_EARN_RATE,
  LOYALTY_MAX_REDEEM_PERCENT,
} from "@/constants/LoyaltyStore";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";
const SUCCESS  = "#22C55E";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LoyaltyPointsScreen({ onClose = () => router.back() }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const currentEmail = await AsyncStorage.getItem("currentUserEmail");
    if (!currentEmail) return;
    setEmail(currentEmail);
    const [bal, hist] = await Promise.all([
      getPoints(currentEmail),
      getPointsHistory(currentEmail),
    ]);
    setPoints(bal);
    setHistory(hist);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const naira = pointsToNaira(points);

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Points</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} colors={[ORANGE]} />
        }
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconWrap}>
            <Ionicons name="ribbon" size={28} color={WHITE} />
          </View>
          <Text style={styles.balanceLabel}>Your points</Text>
          <Text style={styles.balanceValue}>{points.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>Worth ₦{naira.toLocaleString()} in discounts</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoRow}>
            <Ionicons name="add-circle-outline" size={18} color={SUCCESS} />
            <Text style={styles.infoText}>
              Earn 1 point per ₦{LOYALTY_EARN_RATE} spent on any order of ₦{LOYALTY_EARN_THRESHOLD.toLocaleString()} or more.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={18} color={ORANGE} />
            <Text style={styles.infoText}>
              Redeem points at checkout for up to {Math.round(LOYALTY_MAX_REDEEM_PERCENT * 100)}% off your order subtotal.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>History</Text>

        {!email ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="log-in-outline" size={40} color={MUTED} />
            <Text style={styles.emptyText}>Log in to see your points</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="ribbon-outline" size={40} color={MUTED} />
            <Text style={styles.emptyText}>No points activity yet</Text>
            <Text style={styles.emptySub}>
              Place an order of ₦{LOYALTY_EARN_THRESHOLD.toLocaleString()} or more to start earning.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View
                  style={[
                    styles.historyIconWrap,
                    { backgroundColor: entry.type === "earned" ? "#E9F9EF" : "#FFF1EC" },
                  ]}
                >
                  <Ionicons
                    name={entry.type === "earned" ? "add" : "remove"}
                    size={16}
                    color={entry.type === "earned" ? SUCCESS : ORANGE}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{entry.title}</Text>
                  {entry.subtitle ? (
                    <Text style={styles.historySub} numberOfLines={1}>{entry.subtitle}</Text>
                  ) : null}
                  <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                </View>
                <Text style={[styles.historyPoints, { color: entry.type === "earned" ? SUCCESS : ORANGE }]}>
                  {entry.type === "earned" ? "+" : "-"}{entry.points.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
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

  balanceCard: {
    backgroundColor: ORANGE, marginHorizontal: 16, marginTop: 16,
    borderRadius: 24, padding: 24, alignItems: "center",
    shadowColor: ORANGE, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  balanceIconWrap: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  balanceValue: { color: WHITE, fontSize: 40, fontWeight: "800", marginTop: 4 },
  balanceSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 6 },

  infoCard: {
    backgroundColor: WHITE, marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", color: BLACK, marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  infoText: { flex: 1, fontSize: 13, color: MUTED, lineHeight: 19 },

  sectionTitle: {
    fontSize: 16, fontWeight: "700", color: BLACK,
    marginHorizontal: 20, marginTop: 22, marginBottom: 10,
  },

  historyList: { marginHorizontal: 16 },
  historyRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  historyIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 14, fontWeight: "600", color: BLACK },
  historySub: { fontSize: 12, color: MUTED, marginTop: 2 },
  historyDate: { fontSize: 11, color: "#BBB", marginTop: 2 },
  historyPoints: { fontSize: 14, fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingVertical: 50, paddingHorizontal: 40 },
  emptyText: { fontSize: 15, fontWeight: "600", color: BLACK, marginTop: 12 },
  emptySub: { fontSize: 13, color: MUTED, marginTop: 4, textAlign: "center", lineHeight: 18 },
});
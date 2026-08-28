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
import { getPoints, pointsToNaira } from "@/constants/LoyaltyStore";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";
const PURPLE   = "#8B5CF6";

type Promo = {
  id: string;
  title: string;
  description: string;
  badge: string;
  color: string;
  icon: string;
  expiresLabel: string;
};

const PROMOS: Promo[] = [
  {
    id: "welcome10",
    title: "10% Off Your Next Order",
    description: "Applies automatically to orders over ₦5,000. No code needed.",
    badge: "10% OFF",
    color: ORANGE,
    icon: "pricetag",
    expiresLabel: "Ongoing",
  },
  {
    id: "freedelivery",
    title: "Free Delivery Weekends",
    description: "Delivery fee waived on all orders placed Saturday & Sunday.",
    badge: "FREE DELIVERY",
    color: "#3B82F6",
    icon: "bicycle",
    expiresLabel: "Every weekend",
  },
  {
    id: "referafriend",
    title: "Refer a Friend",
    description: "You and your friend each get ₦1,000 wallet credit when they place their first order.",
    badge: "₦1,000",
    color: "#22C55E",
    icon: "people",
    expiresLabel: "Ongoing",
  },
];

export default function PromotionsScreen({ onClose = () => router.back() }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState(0);
  const [hasAccount, setHasAccount] = useState(false);

  const load = useCallback(async () => {
    const email = await AsyncStorage.getItem("currentUserEmail");
    if (!email) return;
    setHasAccount(true);
    setPoints(await getPoints(email));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions & Offers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {hasAccount && (
          <View style={styles.pointsBanner}>
            <View style={styles.pointsIconWrap}>
              <Ionicons name="ribbon" size={22} color={WHITE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointsBannerTitle}>
                {points > 0 ? `You have ${points.toLocaleString()} points` : "Start earning points"}
              </Text>
              <Text style={styles.pointsBannerSub}>
                {points > 0
                  ? `Worth ₦${pointsToNaira(points).toLocaleString()} off your next order`
                  : "Earn points on every order of ₦5,000 or more"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={WHITE} />
          </View>
        )}

        <Text style={styles.sectionLabel}>Current offers</Text>

        <View style={styles.list}>
          {PROMOS.map((promo) => (
            <View key={promo.id} style={styles.card}>
              <View style={[styles.cardIconWrap, { backgroundColor: promo.color + "18" }]}>
                <Ionicons name={promo.icon as any} size={22} color={promo.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.badge, { backgroundColor: promo.color }]}>
                    <Text style={styles.badgeText}>{promo.badge}</Text>
                  </View>
                  <Text style={styles.expiresText}>{promo.expiresLabel}</Text>
                </View>
                <Text style={styles.cardTitle}>{promo.title}</Text>
                <Text style={styles.cardDesc}>{promo.description}</Text>
              </View>
            </View>
          ))}
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

  pointsBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: PURPLE, marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 16,
    shadowColor: PURPLE, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  pointsIconWrap: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  pointsBannerTitle: { color: WHITE, fontSize: 14, fontWeight: "700" },
  pointsBannerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },

  sectionLabel: { fontSize: 15, fontWeight: "700", color: BLACK, marginHorizontal: 20, marginTop: 22, marginBottom: 4 },

  list: { marginHorizontal: 16, marginTop: 12 },
  card: {
    flexDirection: "row", gap: 14,
    backgroundColor: WHITE, borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },
  expiresText: { fontSize: 11, color: MUTED },
  cardTitle: { fontSize: 14, fontWeight: "700", color: BLACK, marginBottom: 3 },
  cardDesc: { fontSize: 12, color: MUTED, lineHeight: 17 },
});
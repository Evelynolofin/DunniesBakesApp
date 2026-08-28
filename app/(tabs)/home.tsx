import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Pressable,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import { router } from "expo-router";
import { cartStore } from "@/constants/Cartstore";
import type { Href } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  getUnreadCount,
  markAllRead,
  requestNotificationPermission,
} from "@/constants/Notificationservice";
import { ALL_ITEMS } from "@/constants/FoodItems";
// import type { Category, FoodItem } from "@/constants/FoodItems";
import { wishlistStore } from "@/constants/Wishliststore";
import LoyaltyPointsScreen from "@/components/LoyaltyPoints";
import PaymentMethodsScreen from "@/components/PaymentMethods";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = 260;

const ORANGE = "#F6410B";
const BLACK = "#1A1A1A";
const LIGHT_BG = "#F5F5F5";
const WHITE = "#FFFFFF";

type Category = { id: string; label: string; emoji: string };
type FoodItem = {
  id: string;
  name: string;
  image: { uri: string };
  category: string;
};
type DrawerItem = {
  label: string;
  icon: string;
  route?: Href;
};

const CATEGORIES: Category[] = [
  { id: "food",    label: "Food",    emoji: "🍔" },
  { id: "snacks",  label: "Snacks",  emoji: "🍟" },
  { id: "dessert", label: "Dessert", emoji: "🍦" },
  { id: "drinks",  label: "Drinks",  emoji: "🥤" },
];

const DRAWER_ITEMS: DrawerItem[] = [
  { label: "Profile", icon: "person-outline", route: "/(tabs)/profile" },
  { label: "Wishlist", icon: "heart-outline", route: "/(tabs)/wishlist" },
  { label: "Loyalty Points", icon: "ribbon-outline" },
  { label: "Payment Methods", icon: "card-outline" },
  {label: "Order History", icon: "receipt-outline", route: "/(tabs)/order" },
  { label: "Logout", icon: "log-out-outline" },
];

  function Drawer({ translateX, onClose, username, isOpen, onOpenLoyalty, onOpenPaymentMethods}: {
    translateX: Animated.Value;
    onClose: () => void;
    username: string;
    isOpen: boolean;     
    onOpenLoyalty: () => void;
    onOpenPaymentMethods: () => void;
  }) {
  return (
    <>
      {isOpen && (
        <Animated.View
          style={[styles.overlay, { opacity: translateX.interpolate({
            inputRange: [-DRAWER_WIDTH, 0],
            outputRange: [0, 0.35],
          }) }]}
          pointerEvents={isOpen ? "auto" : "none"}  
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [-DRAWER_WIDTH, 0],
                  outputRange: [-DRAWER_WIDTH, 0],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.drawerContent}>
            <Text style={styles.drawerName}>{username}</Text>
            {DRAWER_ITEMS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.drawerItem} activeOpacity={0.7} 
                onPress={() => {
                if (item.label === "Logout") {
                  Alert.alert(
                    "Logout",
                    "Are you sure you want to log out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Logout",
                        style: "destructive",
                        onPress: async () => {
                          await AsyncStorage.removeItem("currentUserEmail");
                          await cartStore.clearForCurrentUser();
                          await wishlistStore.resetInMemory();
                          onClose();
                          router.replace("/auth/login");
                        },
                      },
                    ]
                  );
                  return;
                }

                if (item.label === "Loyalty Points") {
                  onClose();
                  onOpenLoyalty();
                  return;
                }

                if (item.label === "Payment Methods") {
                  onClose();
                  onOpenPaymentMethods();
                  return;
                }

              if (item.route) {
                router.push(item.route);
              }
            }}
              >
                <Ionicons name={item.icon as any} size={22} color="white" />
                <Text style={styles.drawerItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

function CategoryTab({
  item,
  active,
  onPress,
}: {
  item: Category;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.catItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.catIconWrap, active ? styles.catActive : styles.catInactive]}>
        <Text style={styles.catEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.catLabel, active && styles.catLabelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function FoodCard({ item }: { item: FoodItem }) {
  return (
    <TouchableOpacity
      style={styles.foodCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/products",
          params: { category: item.category, highlight: item.name },
        })
      }
    >
      <Image source={item.image} style={styles.foodImage} resizeMode="cover" />
      <View style={styles.foodOverlay}>
        <Text style={styles.foodName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
    const [username, setUsername] = useState("")
    const [activeCategory, setActiveCategory] = useState("food");
    const [searchQuery, setSearchQuery] = useState("");
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loyaltyVisible, setLoyaltyVisible] = useState(false);
    const [paymentMethodsVisible, setPaymentMethodsVisible] = useState(false);
    const [unreadCount,    setUnreadCount]    = useState(0);

    const appState   = useRef<AppStateStatus>(AppState.currentState);
    const [totalCartItems, setTotalCartItems] = useState(() => cartStore.getTotalQuantity());
    
    const syncCart = useCallback(() => setTotalCartItems(cartStore.getTotalQuantity()), []);

    const refreshUnread = useCallback(async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    }, []);

    useEffect(() => {
      cartStore.load();
      cartStore.addListener(syncCart);
      return () => cartStore.removeListener(syncCart);
    }, [syncCart]);

    useEffect(() => {
      AsyncStorage.getItem("currentUserEmail").then(async (email) => {
        if (email) {
          const name = await AsyncStorage.getItem(`fullName_${email}`)
          if (name) setUsername(name)
        }
      })
      requestNotificationPermission();
      refreshUnread();
    }, []);

    useEffect(() => {
      const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && next === "active") {
          refreshUnread();
        }
        appState.current = next;
      });
      return () => sub.remove();
    }, [refreshUnread]);
  
    useEffect(() => {
      const sub = Notifications.addNotificationReceivedListener(() => {
        refreshUnread();
      });
      return () => sub.remove();
    }, [refreshUnread]);
  
    useEffect(() => {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        if (data?.screen === "order") {
          router.push("/(tabs)/order" as any);
        } else {
          router.push("/Notifications" as any);
        }
      });
      return () => sub.remove();
    }, []);
  

    const openDrawer = () => {
      setDrawerOpen(true);  
    Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
    }).start();
    };

    const closeDrawer = () => {
    Animated.spring(translateX, {
        toValue: -DRAWER_WIDTH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
    }).start(() => setDrawerOpen(false)); 
    };

    const displayedItems = useMemo(() => {
    const byCategory = ALL_ITEMS.filter((item) => item.category === activeCategory);
    if (!searchQuery.trim()) return byCategory;
    return byCategory.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    }, [activeCategory, searchQuery]);

    const sectionTitle =
    CATEGORIES.find((c) => c.id === activeCategory)?.label + " Menu";

    const handleCategoryPress = (id: string) => {
      setActiveCategory(id);
      setSearchQuery(""); 
    };

    return (
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
          <View style={styles.safeArea}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    onPress={openDrawer}
                    style={styles.menuBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="menu" size={35} color="#747474" />
                  </TouchableOpacity>

                  <Text style={styles.headerName}>
                    {username} 👋
                  </Text>
                </View>

                <View style={styles.headerRight}>
                  {/* ── Notification bell ── */}
                  <TouchableOpacity
                    style={styles.bellBtn}
                    activeOpacity={0.8}
                    onPress={async () => {
                      router.push("/Notifications" as any);
                      if (unreadCount > 0) {
                        await markAllRead();
                        setUnreadCount(0);
                      }
                    }}
                  >
                    <Ionicons name="notifications-outline" size={24} color={BLACK} />
                    {unreadCount > 0 && (
                      <View style={styles.bellBadge}>
                        <Text style={styles.bellBadgeText}>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
      
                  {/* Cart button */}
                  <TouchableOpacity
                    style={styles.cartBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: "/products",
                        params: {
                          category: cartStore.getCartScope()?.category ?? activeCategory,
                          highlight: cartStore.getCartScope()?.family ?? "",
                        },
                      })
                    }
                  >
                    <Ionicons name="bag-sharp" size={24} color="white" />
                    {totalCartItems > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                <View style={styles.searchWrap}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
                    <TextInput
                      placeholder={`Search in ${CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ""}...`}
                      placeholderTextColor="#BBB"
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                    />
                    {searchQuery ? (
                      <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Text style={styles.clearBtn}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.catRow}
                  nestedScrollEnabled={true}
                  >
                  {CATEGORIES.map((cat) => (
                    <CategoryTab
                      key={cat.id}
                      item={cat}
                      active={cat.id === activeCategory}
                      onPress={() => handleCategoryPress(cat.id)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>{sectionTitle}</Text>

                {displayedItems.length > 0 ? (
                  <View style={styles.foodGrid}>
                    {displayedItems.map((item) => (
                      <FoodCard key={item.id} item={item} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🍽️</Text>
                    <Text style={styles.emptyTitle}>Nothing found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try a different search or browse another category
                    </Text>
                  </View>
                )}
                <View style={{ height: 30 }} />
              </ScrollView>
          </View>

          <Drawer
            translateX={translateX}
            onClose={closeDrawer}
            username={username}
            isOpen={drawerOpen}
            onOpenLoyalty={() => setLoyaltyVisible(true)}
            onOpenPaymentMethods={() => setPaymentMethodsVisible(true)}
          />

          {loyaltyVisible && (
            <View style={StyleSheet.absoluteFillObject}>
              <LoyaltyPointsScreen onClose={() => setLoyaltyVisible(false)} />
            </View>
          )}

          {paymentMethodsVisible && (
            <View style={StyleSheet.absoluteFillObject}>
              <PaymentMethodsScreen onClose={() => setPaymentMethodsVisible(false)} />
            </View>
          )}
      </View>
    )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  safeArea: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 10,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: ORANGE,
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center", 
  },
  drawerName: {
    color: WHITE,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
  },
  drawerItemIcon: { fontSize: 22 },
  drawerItemLabel: { color: WHITE, fontSize: 16, fontWeight: "500" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerRight: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },

  headerName: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: "700",
    color: BLACK,
  },

  menuBtn: { gap: 5, justifyContent: "center" },

  bellBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: WHITE,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  bellBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: ORANGE,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },

  cartBtn: {
    backgroundColor: ORANGE,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: BLACK,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },

  greeting: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greetingSub: { color: "#999", fontSize: 13 },
  greetingName: { color: BLACK, fontSize: 22, fontWeight: "700", marginTop: 2 },

  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  searchBox: {
    backgroundColor: "#EFEFEF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: "#333" },
  clearBtn: { fontSize: 14, color: "#999", paddingHorizontal: 4 },

  catRow: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },

  catItem: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12, 
  },
  catIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  catActive: { backgroundColor: BLACK },
  catInactive: {
    backgroundColor: WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 12, fontWeight: "500", color: "#999", paddingTop: 6 },
  catLabelActive: { color: BLACK, fontWeight: "700" },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BLACK,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
  },

  foodGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  foodCard: {
    width: (SCREEN_WIDTH - 54) / 2,
    height: 160, 
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  foodImage: {
    width: "100%",
    height: "100%",
  },

  foodOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 6,
    alignItems: "center",
  },

  foodName: {
    fontSize: 14,
    fontWeight: "600",
    color: WHITE,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: BLACK, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 20 },
});

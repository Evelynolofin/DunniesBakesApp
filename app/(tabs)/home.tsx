import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useRef, useMemo, useEffect } from "react";
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
} from "react-native";

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

const CATEGORIES: Category[] = [
  { id: "food",    label: "Food",    emoji: "🍔" },
  { id: "snacks",  label: "Snacks",  emoji: "🍟" },
  { id: "dessert", label: "Dessert", emoji: "🍦" },
  { id: "drinks",  label: "Drinks",  emoji: "🥤" },
];

const ALL_ITEMS: FoodItem[] = [
  {
    id: "f1", name: "Pizza",
    image: { uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" },
    category: "food",
  },
  {
    id: "f2", name: "BBQ Ribs",
    image: { uri: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400" },
    category: "food",
  },
  {
    id: "f3", name: "Sushi",
    image: { uri: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400" },
    category: "food",
  },
  {
    id: "f4", name: "Burger",
    image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
    category: "food",
  },
  {
    id: "f5",
    name: "Pasta",
    image: { uri: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400" },
    category: "food",
  },
  {
    id: "f6",
    name: "Fried Chicken",
    image: { uri: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400" },
    category: "food",
  },
  {
    id: "f7",
    name: "Tacos",
    image: { uri: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400" },
    category: "food",
  },
  {
    id: "f8",
    name: "Salad",
    image: { uri: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400" },
    category: "food",
  },
  {
    id: "f9",
    name: "Pancakes",
    image: { uri: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400" },
    category: "food",
  },
  {
    id: "f10",
    name: "Steak",
    image: { uri: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400" },
    category: "food",
  },
  {
    id: "f11",
    name: "Jollof Rice",
    image: {
      uri: "https://images.unsplash.com/photo-1665332195309-9d75071138f0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    category: "food",
  },
  {
    id: "f12",
    name: "Fried Rice",
    image: { uri: "https://images.unsplash.com/photo-1772693471187-6e7d364f99ee?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    category: "food",
  },
  {
    id: "f13",
    name: "White Rice",
    image: { uri: "https://images.unsplash.com/photo-1773620494047-50cb58f59bc5?q=80&w=1481&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    category: "food",
  },
  {
    id: "f14",
    name: "Moi Moi",
    image: { uri: "https://www.seriouseats.com/thmb/T8xxjYuukzFtS_zipHupzSL6PQQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/20230111-Moin-Moin-Maureen-Celestine-hero-5c656cbc3b684be1b1f29414f2bdc29c.JPG" },
    category: "food",
  },

  {
    id: "s1", name: "French Fries",
    image: { uri: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
    category: "snacks",
  },
  {
    id: "s2", name: "Nachos",
    image: { uri: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400" },
    category: "snacks",
  },
  {
    id: "s3", name: "Popcorn",
    image: { uri: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400" },
    category: "snacks",
  },
  {
    id: "s4", name: "Spring Rolls",
    image: { uri: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" },
    category: "snacks",
  },
  {
    id: "s5",
    name: "Chicken Wings",
    image: { uri: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" },
    category: "snacks",
  },
  {
    id: "s6",
    name: "Hot Dog",
    image: { uri: "https://plus.unsplash.com/premium_photo-1713793236612-50c9bfedbe07?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    category: "snacks",
  },
  {
    id: "s7",
    name: "Burger Sliders",
    image: { uri: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
    category: "snacks",
  },
  {
    id: "s8",
    name: "Doughnuts",
    image: { uri: "https://images.pexels.com/photos/7034120/pexels-photo-7034120.jpeg" },
    category: "snacks",
  },
  {
    id: "s9",
    name: "Pretzels",
    image: { uri: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400" },
    category: "snacks",
  },
  {
    id: "s10",
    name: "Chicken Nuggets",
    image: { uri: "https://images.pexels.com/photos/10183543/pexels-photo-10183543.jpeg" },
    category: "snacks",
  },
  {
    id: "s11",
    name: "Garlic Bread",
    image: { uri: "https://images.pexels.com/photos/1460860/pexels-photo-1460860.jpeg" },
    category: "snacks",
  },
  {
    id: "s12",
    name: "Pizza Bites",
    image: { uri: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400" },
    category: "snacks",
  },

  {
    id: "d1", name: "Ice Cream",
    image: { uri: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400" },
    category: "dessert",
  },
  {
    id: "d2", name: "Chocolate Cake",
    image: { uri: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" },
    category: "dessert",
  },
  {
    id: "d3", name: "Waffles",
    image: { uri: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400" },
    category: "dessert",
  },
  {
    id: "d4", name: "Cheesecake",
    image: { uri: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400" },
    category: "dessert",
  },

  {
    id: "dr1", name: "Lemonade",
    image: { uri: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400" },
    category: "drinks",
  },
  {
    id: "dr2", name: "Smoothie",
    image: { uri: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" },
    category: "drinks",
  },
  {
    id: "dr3", name: "Iced Coffee",
    image: { uri: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
    category: "drinks",
  },
  {
    id: "dr4", name: "Milkshake",
    image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
    category: "drinks",
  },
];


const DRAWER_ITEMS = [
  { label: "Profile",         icon: "person-outline" },
  { label: "Wishlist",        icon: "heart-outline" },
  { label: "Loyalty Points",  icon: "ribbon-outline" },
  { label: "Payment Methods", icon: "card-outline" },
];

function Drawer({
  translateX,
  onClose,
  username,
}: {
  translateX: Animated.Value;
  onClose: () => void;
  username: string;
}) {
  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: translateX.interpolate({
              inputRange: [-DRAWER_WIDTH, 0],
              outputRange: [0, 0.35],
            }),
          },
        ]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

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
              <TouchableOpacity key={item.label} style={styles.drawerItem} activeOpacity={0.7}>
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
    <TouchableOpacity style={styles.foodCard} activeOpacity={0.85}>
      <Image source={item.image} style={styles.foodImage} resizeMode="cover" />

      {/* optional overlay label */}
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

    useEffect(() => {
      AsyncStorage.getItem("currentUserEmail").then(async (email) => {
        if (email) {
          const name = await AsyncStorage.getItem(`fullName_${email}`)
          if (name) setUsername(name)
        }
      })
    }, []);

    const openDrawer = () => {
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
    }).start();
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
          <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

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

                <TouchableOpacity style={styles.cartBtn} activeOpacity={0.8}>
                  <Ionicons name="bag-sharp" size={24} color="white" />
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>3</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* <View style={styles.greeting}>
                  <Text style={styles.greetingName}>{username}  👋</Text>
                </View> */}

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

          <Drawer translateX={translateX} onClose={closeDrawer} username={username} />
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
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerName: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: "700",
    color: BLACK,
  },

  menuBtn: { gap: 5, justifyContent: "center" },
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
    backgroundColor: ORANGE,
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
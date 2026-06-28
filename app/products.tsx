import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { cartStore, CartProduct } from "@/constants/Cartstore";
import CheckoutScreen from "@/components/Checkout";
import { wishlistStore } from "@/constants/Wishliststore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ORANGE = "#F6410B";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: { uri: string };
  category: string;  
  family: string;  
  tag?: string;
};

type CartItem = Product & { quantity: number };

const ALL_PRODUCTS: Product[] = [
  { id: "pz1", name: "Margherita Pizza",      family: "Pizza",        category: "food",    price: 3500, tag: "Popular", description: "Classic tomato base with fresh mozzarella and basil.",              image: { uri: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400" } },
  { id: "pz2", name: "Pepperoni Pizza",        family: "Pizza",        category: "food",    price: 4000, tag: "Spicy",   description: "Loaded with spicy pepperoni slices and melted cheese.",           image: { uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" } },
  { id: "pz3", name: "BBQ Chicken Pizza",      family: "Pizza",        category: "food",    price: 4200,                description: "Smoky BBQ sauce, grilled chicken and red onions.",                 image: { uri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" } },
  { id: "pz4", name: "Veggie Pizza",           family: "Pizza",        category: "food",    price: 3200, tag: "New",    description: "Colourful mixed vegetables on a herbed tomato base.",              image: { uri: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400" } },

  { id: "rb1", name: "Full Rack Ribs",         family: "BBQ Ribs",     category: "food",    price: 8000, tag: "Popular", description: "Full slab of slow-cooked ribs glazed in smoky BBQ sauce.",       image: { uri: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400" } },
  { id: "rb2", name: "Half Rack Ribs",         family: "BBQ Ribs",     category: "food",    price: 4500,                description: "Half slab of tender pork ribs, perfect for one.",                 image: { uri: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" } },
  { id: "rb3", name: "Ribs & Fries Combo",     family: "BBQ Ribs",     category: "food",    price: 5500,                description: "Half rack of ribs served with crispy seasoned fries.",            image: { uri: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" } },

  { id: "su1", name: "Salmon Roll",            family: "Sushi",        category: "food",    price: 3500,                description: "Fresh salmon with cucumber and avocado wrapped in rice.",         image: { uri: "https://images.pexels.com/photos/26731026/pexels-photo-26731026.jpeg" } },
  { id: "su2", name: "Tuna Nigiri",            family: "Sushi",        category: "food",    price: 2800, tag: "Popular", description: "Hand-pressed sushi rice topped with fresh tuna.",                 image: { uri: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400" } },
  { id: "su3", name: "Dragon Roll",            family: "Sushi",        category: "food",    price: 4500, tag: "New",    description: "Prawn tempura inside, avocado and tobiko on top.",               image: { uri: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400" } },
  { id: "su4", name: "Sushi Platter (12pcs)",  family: "Sushi",        category: "food",    price: 6000,                description: "Assorted 12-piece platter with wasabi and pickled ginger.",      image: { uri: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400" } },

  { id: "bg1", name: "Classic Beef Burger",    family: "Burger",       category: "food",    price: 2200, tag: "Popular", description: "Juicy beef patty, lettuce, tomato and special sauce.",           image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" } },
  { id: "bg2", name: "Double Smash Burger",    family: "Burger",       category: "food",    price: 3200,                description: "Two smashed beef patties with caramelised onions.",               image: { uri: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400" } },
  { id: "bg3", name: "Chicken Burger",         family: "Burger",       category: "food",    price: 2500,                description: "Crispy fried chicken fillet with coleslaw and mayo.",             image: { uri: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" } },
  { id: "bg4", name: "Veggie Burger",          family: "Burger",       category: "food",    price: 2000, tag: "New",    description: "Plant-based patty with all the classic toppings.",               image: { uri: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400" } },

  { id: "pa1", name: "Spaghetti Bolognese",    family: "Pasta",        category: "food",    price: 2800, tag: "Popular", description: "Classic meat sauce simmered low and slow over spaghetti.",       image: { uri: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400" } },
  { id: "pa2", name: "Penne Arrabbiata",       family: "Pasta",        category: "food",    price: 2500, tag: "Spicy",  description: "Penne tossed in fiery tomato and garlic sauce.",                  image: { uri: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400" } },
  { id: "pa3", name: "Creamy Alfredo",         family: "Pasta",        category: "food",    price: 3000,                description: "Fettuccine in a rich parmesan cream sauce.",                     image: { uri: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400" } },

  { id: "fc1", name: "2-Piece Fried Chicken",  family: "Fried Chicken",category: "food",    price: 1800, tag: "Popular", description: "Two crispy golden pieces with your choice of side.",             image: { uri: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400" } },
  { id: "fc2", name: "4-Piece Fried Chicken",  family: "Fried Chicken",category: "food",    price: 3200,                description: "Four pieces, extra crispy skin, juicy inside.",                  image: { uri: "https://images.pexels.com/photos/12118977/pexels-photo-12118977.jpeg" } },
  { id: "fc3", name: "Spicy Fried Chicken",    family: "Fried Chicken",category: "food",    price: 2000, tag: "Spicy",  description: "Hot chilli-marinated fried chicken that packs a punch.",         image: { uri: "https://images.pexels.com/photos/20152618/pexels-photo-20152618.jpeg" } },

  { id: "tc1", name: "Beef Tacos (3pcs)",      family: "Tacos",        category: "food",    price: 2200,                description: "Seasoned ground beef in corn tortillas with salsa.",             image: { uri: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400" } },
  { id: "tc2", name: "Chicken Tacos (3pcs)",   family: "Tacos",        category: "food",    price: 2000, tag: "Popular", description: "Grilled chicken strips with pico de gallo and cheese.",          image: { uri: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400" } },
  { id: "tc3", name: "Fish Tacos (3pcs)",      family: "Tacos",        category: "food",    price: 2500, tag: "New",    description: "Crispy battered fish with lime crema and shredded cabbage.",     image: { uri: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400" } },

  { id: "sl1", name: "Caesar Salad",           family: "Salad",        category: "food",    price: 1800, tag: "Popular", description: "Romaine lettuce, croutons, parmesan and Caesar dressing.",       image: { uri: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400" } },
  { id: "sl2", name: "Greek Salad",            family: "Salad",        category: "food",    price: 1600,                description: "Cucumber, tomato, olives, feta and oregano dressing.",           image: { uri: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400" } },
  { id: "sl3", name: "Chicken Salad",          family: "Salad",        category: "food",    price: 2200,                description: "Grilled chicken breast over mixed greens with vinaigrette.",     image: { uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400" } },

  { id: "pk1", name: "Classic Pancakes",       family: "Pancakes",     category: "food",    price: 1500,                description: "Fluffy stack of three with maple syrup and butter.",             image: { uri: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400" } },
  { id: "pk2", name: "Blueberry Pancakes",     family: "Pancakes",     category: "food",    price: 1800, tag: "Popular", description: "Golden pancakes loaded with fresh blueberries.",                 image: { uri: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400" } },
  { id: "pk3", name: "Chocolate Pancakes",     family: "Pancakes",     category: "food",    price: 2000, tag: "New",    description: "Rich chocolate batter pancakes with Nutella drizzle.",          image: { uri: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400" } },

  { id: "st1", name: "Ribeye Steak",           family: "Steak",        category: "food",    price: 8500, tag: "Popular", description: "300g well-marbled ribeye, grilled to your preference.",          image: { uri: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400" } },
  { id: "st2", name: "Sirloin Steak",          family: "Steak",        category: "food",    price: 7000,                description: "Lean 250g sirloin with herb butter and seasonal veg.",           image: { uri: "https://images.unsplash.com/photo-1558030137-a56c1b004fa3?w=400" } },
  { id: "st3", name: "Steak & Chips",          family: "Steak",        category: "food",    price: 9000,                description: "Ribeye steak served with thick-cut chips and peppercorn sauce.", image: { uri: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400" } },

  { id: "jr1", name: "Jollof Rice (Small)",    family: "Jollof Rice",  category: "food",    price: 1500, tag: "Popular", description: "Smoky party jollof rice, small portion.",                        image: { uri: "https://images.unsplash.com/photo-1665332195309-9d75071138f0?w=400" } },
  { id: "jr2", name: "Jollof Rice (Large)",    family: "Jollof Rice",  category: "food",    price: 2500,                description: "Generous large portion of smoky West African jollof.",          image: { uri: "https://images.unsplash.com/photo-1665332195309-9d75071138f0?w=400" } },
  { id: "jr3", name: "Jollof Rice & Chicken",  family: "Jollof Rice",  category: "food",    price: 3500,                description: "Jollof rice served with a piece of fried or grilled chicken.",  image: { uri: "https://images.unsplash.com/photo-1603496987674-79600a000f55?q=80&w=985&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" } },
  { id: "jr4", name: "Jollof Rice & Fish",     family: "Jollof Rice",  category: "food",    price: 3200,                description: "Jollof rice paired with seasoned grilled tilapia.",             image: { uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400" } },

  { id: "fr1", name: "Fried Rice (Small)",     family: "Fried Rice",   category: "food",    price: 1500,                description: "Nigerian-style fried rice, small portion.",                     image: { uri: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" } },
  { id: "fr2", name: "Fried Rice (Large)",     family: "Fried Rice",   category: "food",    price: 2500, tag: "Popular", description: "Large portion of colourful, well-seasoned fried rice.",          image: { uri: "https://images.unsplash.com/photo-1772693471187-6e7d364f99ee?w=400" } },
  { id: "fr3", name: "Fried Rice & Turkey",   family: "Fried Rice",   category: "food",    price: 3500,                description: "Fried rice with fried or grilled Turkey on the side.",         image: { uri: "https://images.pexels.com/photos/25361536/pexels-photo-25361536.jpeg" } },

  { id: "wr1", name: "White Rice & Stew",      family: "White Rice",   category: "food",    price: 1800,                description: "Steamed white rice with rich tomato-beef stew.",                image: { uri: "https://images.unsplash.com/photo-1773620494047-50cb58f59bc5?w=400" } },
  { id: "wr2", name: "White Rice & Egusi",     family: "White Rice",   category: "food",    price: 2000, tag: "Local",  description: "White rice served with thick egusi melon seed soup.",           image: { uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400" } },
  { id: "wr3", name: "White Rice & Bitterleaf",family: "White Rice",   category: "food",    price: 2000,                description: "Steamed rice with traditional bitterleaf vegetable soup.",      image: { uri: "https://images.unsplash.com/photo-1512058454905-6b841e7ad132?w=400" } },

  { id: "mm1", name: "Moi Moi (Plain)",        family: "Moi Moi",      category: "food",    price: 600,  tag: "Local",  description: "Classic steamed bean pudding with peppers and spices.",         image: { uri: "https://www.seriouseats.com/thmb/T8xxjYuukzFtS_zipHupzSL6PQQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/20230111-Moin-Moin-Maureen-Celestine-hero-5c656cbc3b684be1b1f29414f2bdc29c.JPG" } },
  { id: "mm2", name: "Moi Moi with Egg",       family: "Moi Moi",      category: "food",    price: 800,                description: "Bean pudding steamed with a whole boiled egg inside.",           image: { uri: "https://www.seriouseats.com/thmb/T8xxjYuukzFtS_zipHupzSL6PQQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/20230111-Moin-Moin-Maureen-Celestine-hero-5c656cbc3b684be1b1f29414f2bdc29c.JPG" } },
  { id: "mm3", name: "Moi Moi with Fish",      family: "Moi Moi",      category: "food",    price: 1000, tag: "Popular", description: "Bean pudding packed with seasoned fish pieces.",                  image: { uri: "https://www.seriouseats.com/thmb/T8xxjYuukzFtS_zipHupzSL6PQQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/20230111-Moin-Moin-Maureen-Celestine-hero-5c656cbc3b684be1b1f29414f2bdc29c.JPG" } },

  { id: "ff1", name: "Regular Fries",          family: "French Fries", category: "snacks",  price: 800,  tag: "Popular", description: "Classic golden fries, crispy outside, fluffy inside.",          image: { uri: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" } },
  { id: "ff2", name: "Large Fries",            family: "French Fries", category: "snacks",  price: 1200,                description: "Jumbo portion of seasoned golden fries.",                       image: { uri: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" } },
  { id: "ff3", name: "Cheesy Fries",           family: "French Fries", category: "snacks",  price: 1500,                description: "Fries smothered in warm cheddar cheese sauce.",                 image: { uri: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400" } },
  { id: "ff4", name: "Spicy Fries",            family: "French Fries", category: "snacks",  price: 1000, tag: "Spicy",  description: "Fries tossed in fiery chilli seasoning.",                       image: { uri: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" } },

  { id: "na1", name: "Classic Nachos",         family: "Nachos",       category: "snacks",  price: 1300,                description: "Tortilla chips with cheese, jalapeños, salsa and sour cream.", image: { uri: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400" } },
  { id: "na2", name: "Loaded Nachos",          family: "Nachos",       category: "snacks",  price: 2000, tag: "Popular", description: "Piled high with beef, cheese, guac, salsa and jalapeños.",      image: { uri: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400" } },
  { id: "na3", name: "Chicken Nachos",         family: "Nachos",       category: "snacks",  price: 1800,                description: "Tortilla chips with pulled chicken and melted cheese.",         image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" } },

  { id: "pop1", name: "Salted Popcorn",        family: "Popcorn",      category: "snacks",  price: 400,                 description: "Lightly salted buttery cinema-style popcorn.",                  image: { uri: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400" } },
  { id: "pop2", name: "Caramel Popcorn",       family: "Popcorn",      category: "snacks",  price: 600,  tag: "Popular", description: "Sweet crunchy caramel-coated popcorn.",                          image: { uri: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400" } },
  { id: "pop3", name: "Spicy Popcorn",         family: "Popcorn",      category: "snacks",  price: 500,  tag: "Spicy",  description: "Popcorn tossed in hot chilli and lime seasoning.",              image: { uri: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400" } },

  { id: "sr1", name: "Veg Spring Rolls (4pcs)",family: "Spring Rolls", category: "snacks",  price: 1000,                description: "Crispy rolls filled with seasoned mixed vegetables.",           image: { uri: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" } },
  { id: "sr2", name: "Chicken Spring Rolls",   family: "Spring Rolls", category: "snacks",  price: 1300, tag: "Popular", description: "Golden rolls stuffed with spiced chicken and cabbage.",          image: { uri: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400" } },
  { id: "sr3", name: "Prawn Spring Rolls",     family: "Spring Rolls", category: "snacks",  price: 1500, tag: "New",    description: "Crispy rolls packed with seasoned prawns and glass noodles.",   image: { uri: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400" } },

  { id: "cw1", name: "Buffalo Wings (6pcs)",   family: "Chicken Wings",category: "snacks",  price: 1500, tag: "Spicy",  description: "Crispy wings tossed in tangy buffalo hot sauce.",                image: { uri: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" } },
  { id: "cw2", name: "Honey Garlic Wings",     family: "Chicken Wings",category: "snacks",  price: 1600, tag: "Popular", description: "Wings glazed in sweet honey garlic sauce.",                      image: { uri: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400" } },
  { id: "cw3", name: "BBQ Wings (6pcs)",       family: "Chicken Wings",category: "snacks",  price: 1500,                description: "Smoky barbecue glazed wings, fall-off-the-bone tender.",        image: { uri: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400" } },
  { id: "cw4", name: "Wings Platter (12pcs)",  family: "Chicken Wings",category: "snacks",  price: 2800,                description: "Mixed flavour platter — buffalo, BBQ and honey garlic.",        image: { uri: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" } },

  { id: "hd1", name: "Classic Hot Dog",        family: "Hot Dog",      category: "snacks",  price: 900,                 description: "Beef frankfurter in a soft bun with mustard and ketchup.",     image: { uri: "https://plus.unsplash.com/premium_photo-1713793236612-50c9bfedbe07?w=400" } },
  { id: "hd2", name: "Cheese Hot Dog",         family: "Hot Dog",      category: "snacks",  price: 1100, tag: "Popular", description: "Loaded with melted cheddar and crispy fried onions.",           image: { uri: "https://images.pexels.com/photos/36501073/pexels-photo-36501073.jpeg" } },
  { id: "hd3", name: "Chilli Dog",             family: "Hot Dog",      category: "snacks",  price: 1300, tag: "Spicy",  description: "Topped with spicy beef chilli, cheese and jalapeños.",          image: { uri: "https://images.pexels.com/photos/36501086/pexels-photo-36501086.jpeg" } },

  { id: "bs1", name: "Beef Sliders (3pcs)",    family: "Burger Sliders",category: "snacks", price: 2000, tag: "Popular", description: "Three mini beef burgers with cheese and pickles.",               image: { uri: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" } },
  { id: "bs2", name: "Chicken Sliders (3pcs)", family: "Burger Sliders",category: "snacks", price: 1800,                description: "Three crispy chicken sliders with slaw and sriracha mayo.",     image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" } },

  { id: "dn1", name: "Glazed Doughnut",        family: "Doughnuts",    category: "snacks",  price: 400,                 description: "Classic sugar-glazed ring doughnut, soft and pillowy.",         image: { uri: "https://images.pexels.com/photos/7034120/pexels-photo-7034120.jpeg" } },
  { id: "dn2", name: "Chocolate Doughnut",     family: "Doughnuts",    category: "snacks",  price: 500,  tag: "Popular", description: "Rich chocolate-frosted doughnut with sprinkles.",                image: { uri: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400" } },
  { id: "dn3", name: "Filled Doughnut",        family: "Doughnuts",    category: "snacks",  price: 600,  tag: "New",    description: "Jam or custard filled doughnut dusted with icing sugar.",       image: { uri: "https://images.unsplash.com/photo-1506224772180-d75b3efbe9be?w=400" } },

  { id: "pr1", name: "Salted Pretzel",         family: "Pretzels",     category: "snacks",  price: 700,                 description: "Warm soft pretzel with coarse sea salt and mustard dip.",      image: { uri: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400" } },
  { id: "pr2", name: "Cinnamon Pretzel",       family: "Pretzels",     category: "snacks",  price: 900,  tag: "New",    description: "Sweet cinnamon-sugar coated pretzel with cream cheese dip.",   image: { uri: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=400" } },

  { id: "cn1", name: "Nuggets (6pcs)",         family: "Chicken Nuggets",category: "snacks", price: 1000,               description: "Six golden chicken nuggets with sweet chilli dipping sauce.",  image: { uri: "https://images.pexels.com/photos/10183543/pexels-photo-10183543.jpeg" } },
  { id: "cn2", name: "Nuggets (12pcs)",        family: "Chicken Nuggets",category: "snacks", price: 1800, tag: "Popular",description: "Twelve crispy nuggets — great for sharing.",                    image: { uri: "https://images.pexels.com/photos/10183543/pexels-photo-10183543.jpeg" } },
  { id: "cn3", name: "Spicy Nuggets (6pcs)",   family: "Chicken Nuggets",category: "snacks", price: 1100, tag: "Spicy", description: "Hot and crispy nuggets for spice lovers.",                      image: { uri: "https://images.pexels.com/photos/10183543/pexels-photo-10183543.jpeg" } },

  { id: "gb1", name: "Garlic Bread (4 slices)",family: "Garlic Bread", category: "snacks",  price: 700,                 description: "Toasted baguette slices with garlic butter and parsley.",       image: { uri: "https://images.pexels.com/photos/1460860/pexels-photo-1460860.jpeg" } },
  { id: "gb2", name: "Cheesy Garlic Bread",    family: "Garlic Bread", category: "snacks",  price: 1000, tag: "Popular", description: "Garlic bread loaded with melted mozzarella cheese.",             image: { uri: "https://images.pexels.com/photos/30781826/pexels-photo-30781826.jpeg" } },

  { id: "pb1", name: "Pepperoni Bites (8pcs)", family: "Pizza Bites",  category: "snacks",  price: 1100, tag: "Popular", description: "Bite-sized pizza pockets filled with pepperoni and cheese.",    image: { uri: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400" } },
  { id: "pb2", name: "Veggie Pizza Bites",     family: "Pizza Bites",  category: "snacks",  price: 900,                 description: "Mini pizza bites stuffed with bell peppers and mushrooms.",    image: { uri: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400" } },

  { id: "ic1", name: "Single Scoop",           family: "Ice Cream",    category: "dessert", price: 500,                 description: "One scoop of your choice — vanilla, choc or strawberry.",      image: { uri: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400" } },
  { id: "ic2", name: "Double Scoop",           family: "Ice Cream",    category: "dessert", price: 800,  tag: "Popular", description: "Two scoops with your choice of flavours.",                       image: { uri: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400" } },
  { id: "ic3", name: "Ice Cream Sundae",       family: "Ice Cream",    category: "dessert", price: 1200, tag: "New",    description: "Three scoops with hot fudge, whipped cream and a cherry.",     image: { uri: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400" } },

  { id: "cc1", name: "Chocolate Cake Slice",   family: "Chocolate Cake",category: "dessert",price: 1000, tag: "Popular", description: "Moist chocolate sponge with ganache frosting, one slice.",      image: { uri: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" } },
  { id: "cc2", name: "Whole Chocolate Cake",   family: "Chocolate Cake",category: "dessert",price: 7000,                description: "Full 8-inch layered chocolate cake for celebrations.",           image: { uri: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400" } },
  { id: "cc3", name: "Molten Choc Cake",       family: "Chocolate Cake",category: "dessert",price: 1500, tag: "New",    description: "Warm chocolate lava cake with a gooey melted centre.",          image: { uri: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400" } },

  { id: "wf1", name: "Classic Waffles",        family: "Waffles",      category: "dessert", price: 1200,                description: "Belgian waffles with maple syrup and whipped butter.",          image: { uri: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400" } },
  { id: "wf2", name: "Strawberry Waffles",     family: "Waffles",      category: "dessert", price: 1500, tag: "Popular", description: "Golden waffles with fresh strawberries and cream.",               image: { uri: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400" } },
  { id: "wf3", name: "Nutella Waffles",        family: "Waffles",      category: "dessert", price: 1600, tag: "New",    description: "Crispy waffles smothered in Nutella and banana slices.",        image: { uri: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400" } },

  { id: "ck1", name: "NY Cheesecake Slice",    family: "Cheesecake",   category: "dessert", price: 1200, tag: "Popular", description: "Dense, velvety New York cheesecake on a graham cracker crust.", image: { uri: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400" } },
  { id: "ck2", name: "Strawberry Cheesecake",  family: "Cheesecake",   category: "dessert", price: 1400,                description: "Creamy cheesecake topped with fresh strawberry compote.",       image: { uri: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400" } },
  { id: "ck3", name: "Oreo Cheesecake",        family: "Cheesecake",   category: "dessert", price: 1500, tag: "New",    description: "Smooth cheesecake with an Oreo crumb base and topping.",       image: { uri: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400" } },

  { id: "lm1", name: "Classic Lemonade",       family: "Lemonade",     category: "drinks",  price: 500,                 description: "Freshly squeezed lemonade with a hint of mint.",                image: { uri: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400" } },
  { id: "lm2", name: "Strawberry Lemonade",    family: "Lemonade",     category: "drinks",  price: 700,  tag: "Popular", description: "Tangy lemonade blended with fresh strawberry purée.",            image: { uri: "https://images.pexels.com/photos/5817603/pexels-photo-5817603.jpeg" } },
  { id: "lm3", name: "Sparkling Lemonade",     family: "Lemonade",     category: "drinks",  price: 650,  tag: "New",    description: "Fizzy lemonade with crushed ice and lemon slices.",             image: { uri: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?q=80&w=993&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" } },

  { id: "sm1", name: "Tropical Smoothie",      family: "Smoothie",     category: "drinks",  price: 800,  tag: "Popular", description: "Mango, pineapple and banana blended to perfection.",             image: { uri: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" } },
  { id: "sm2", name: "Berry Blast Smoothie",   family: "Smoothie",     category: "drinks",  price: 900,                 description: "Mixed berries, yoghurt and honey blended smooth.",              image: { uri: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400" } },
  { id: "sm3", name: "Green Smoothie",         family: "Smoothie",     category: "drinks",  price: 850,  tag: "New",    description: "Spinach, cucumber, green apple and ginger blend.",              image: { uri: "https://images.pexels.com/photos/28909422/pexels-photo-28909422.jpeg" } },

  { id: "ic_1", name: "Iced Americano",        family: "Iced Coffee",  category: "drinks",  price: 800,                 description: "Double espresso poured over ice, bold and refreshing.",         image: { uri: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" } },
  { id: "ic_2", name: "Iced Latte",            family: "Iced Coffee",  category: "drinks",  price: 950,  tag: "Popular", description: "Espresso with cold milk over ice, smooth and creamy.",           image: { uri: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400" } },
  { id: "ic_3", name: "Caramel Iced Coffee",   family: "Iced Coffee",  category: "drinks",  price: 1000, tag: "New",    description: "Iced latte swirled with sweet caramel syrup.",                  image: { uri: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400" } },

  { id: "ms1", name: "Vanilla Milkshake",      family: "Milkshake",    category: "drinks",  price: 900,                 description: "Thick creamy vanilla milkshake topped with whipped cream.",     image: { uri: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" } },
  { id: "ms2", name: "Chocolate Milkshake",    family: "Milkshake",    category: "drinks",  price: 950,  tag: "Popular", description: "Rich chocolate milkshake with crushed Oreo crumble.",           image: { uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" } },
  { id: "ms3", name: "Strawberry Milkshake",   family: "Milkshake",    category: "drinks",  price: 900,  tag: "New",    description: "Fresh strawberry blended with ice cream and cold milk.",        image: { uri: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400" } },

  { id: "zo1", name: "Zobo (Small)",           family: "Zobo Drink",   category: "drinks",  price: 300,  tag: "Local",  description: "Chilled hibiscus drink with ginger and cloves, small cup.",     image: { uri: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400" } },
  { id: "zo2", name: "Zobo (Large)",           family: "Zobo Drink",   category: "drinks",  price: 500,  tag: "Local",  description: "Large chilled zobo drink, naturally sweet and tangy.",          image: { uri: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400" } },
  { id: "zo3", name: "Zobo with Pineapple",    family: "Zobo Drink",   category: "drinks",  price: 600,  tag: "New",    description: "Hibiscus drink infused with fresh pineapple juice.",            image: { uri: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400" } },

  { id: "ch1", name: "Classic Chapman",        family: "Chapman",      category: "drinks",  price: 600,                 description: "Fanta, Sprite, grenadine, cucumber and fruit, chilled.",       image: { uri: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" } },
  { id: "ch2", name: "Virgin Chapman",         family: "Chapman",      category: "drinks",  price: 700,  tag: "Popular", description: "Premium non-alcoholic Chapman with extra fruit garnish.",        image: { uri: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" } },

  { id: "bw1", name: "Still Water (50cl)",     family: "Bottled Water",category: "drinks",  price: 150,                 description: "Chilled still mineral water, 50cl bottle.",                    image: { uri: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" } },
  { id: "bw2", name: "Still Water (75cl)",     family: "Bottled Water",category: "drinks",  price: 200,                 description: "Chilled still mineral water, 75cl bottle.",                    image: { uri: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" } },
  { id: "bw3", name: "Sparkling Water",        family: "Bottled Water",category: "drinks",  price: 350,  tag: "New",    description: "Ice-cold sparkling mineral water with natural bubbles.",        image: { uri: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" } },

  { id: "sd1", name: "Coca-Cola",              family: "Soft Drink",   category: "drinks",  price: 300,                 description: "Ice-cold Coca-Cola, 35cl can.",                                 image: { uri: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" } },
  { id: "sd2", name: "Fanta Orange",           family: "Soft Drink",   category: "drinks",  price: 300,                 description: "Chilled Fanta Orange, 35cl can.",                               image: { uri: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" } },
  { id: "sd3", name: "Sprite",                 family: "Soft Drink",   category: "drinks",  price: 300,                 description: "Refreshing lemon-lime Sprite, 35cl can.",                       image: { uri: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" } },
  { id: "sd4", name: "Pepsi",                  family: "Soft Drink",   category: "drinks",  price: 300,                 description: "Ice-cold Pepsi Cola, 35cl can.",                                image: { uri: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" } },
];

function tagColor(tag: string) {
  switch (tag) {
    case "Popular": return "#F6410B";
    case "Spicy":   return "#E53935";
    case "New":     return "#43A047";
    case "Local":   return "#8D6E63";
    default:        return ORANGE;
  }
}

function ConflictModal({
  visible,
  message,
  onReplace,
  onCancel,
}: {
  visible: boolean;
  message: string;
  onReplace: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent   
    >
      <Pressable style={conflict.backdrop} onPress={onCancel} />
      <View style={conflict.box}>
        <Text style={conflict.title}>Start new order?</Text>
        <Text style={conflict.body}>{message}</Text>
        <View style={conflict.row}>
          <TouchableOpacity style={conflict.cancelBtn} onPress={onCancel}>
            <Text style={conflict.cancelText}>Keep cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={conflict.replaceBtn} onPress={onReplace}>
            <Text style={conflict.replaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CartSheet({
  visible, cart, onClose, onIncrease, onDecrease, onRemove, onCheckout,
}: {
  visible: boolean; cart: CartItem[]; onClose: () => void;
  onIncrease: (id: string) => void; onDecrease: (id: string) => void;
  onRemove: (id: string) => void; onCheckout: () => void;
}) {
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent 
      onRequestClose={onClose}
    >
      <Pressable style={sheet.backdrop} onPress={onClose} />
      <View style={[sheet.container, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Your Cart</Text>
        {cart.length === 0 ? (
          <View style={sheet.empty}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={sheet.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.id} style={sheet.row}>
                <Image source={item.image} style={sheet.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={sheet.itemName}>{item.name}</Text>
                  <Text style={sheet.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
                <View style={sheet.qtyRow}>
                  <TouchableOpacity style={sheet.qtyBtn} onPress={() => onDecrease(item.id)}>
                    <Ionicons name="remove" size={16} color={ORANGE} />
                  </TouchableOpacity>
                  <Text style={sheet.qtyNum}>{item.quantity}</Text>
                  <TouchableOpacity style={sheet.qtyBtn} onPress={() => onIncrease(item.id)}>
                    <Ionicons name="add" size={16} color={ORANGE} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onRemove(item.id)} style={{ paddingLeft: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#CCC" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={sheet.totalRow}>
              <Text style={sheet.totalLabel}>Total</Text>
              <Text style={sheet.totalAmount}>₦{total.toLocaleString()}</Text>
            </View>
          </ScrollView>
        )}
        {cart.length > 0 && (
          <TouchableOpacity style={sheet.checkoutBtn} onPress={onCheckout}>
            <Text style={sheet.checkoutText}>Checkout · ₦{total.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

function ProductCard({
  item, cartItem, onAdd, onIncrease, onDecrease,
}: {
  item: Product; cartItem?: CartItem;
  onAdd: (item: Product) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
}) {
  const [wishlisted, setWishlisted] = React.useState(false);
 
  React.useEffect(() => {
    wishlistStore.isWishlisted(item.id).then(setWishlisted);
  }, [item.id]);
 
  async function toggleWishlist() {
    const action = await wishlistStore.toggle(item);
    setWishlisted(action === "added");
  }
 
  return (
    <View style={card.wrap}>
      <View style={card.imageWrap}>
        <Image source={item.image} style={card.image} resizeMode="cover" />
        {item.tag && (
          <View style={[card.tag, { backgroundColor: tagColor(item.tag) }]}>
            <Text style={card.tagText}>{item.tag}</Text>
          </View>
        )}
        <TouchableOpacity style={card.heartBtn} onPress={toggleWishlist} activeOpacity={0.8}>
          <Ionicons
            name={wishlisted ? "heart" : "heart-outline"}
            size={14}
            color={wishlisted ? ORANGE : "#CCC"}
          />
        </TouchableOpacity>
      </View>
      <View style={card.info}>
        <Text style={card.name} numberOfLines={1}>{item.name}</Text>
        <Text style={card.desc} numberOfLines={2}>{item.description}</Text>
        <View style={card.footer}>
          <Text style={card.price}>₦{item.price.toLocaleString()}</Text>
          {cartItem ? (
            <View style={card.qtyControl}>
              <TouchableOpacity style={card.qtyBtn} onPress={() => onDecrease(item.id)}>
                <Ionicons name="remove" size={14} color={WHITE} />
              </TouchableOpacity>
              <Text style={card.qtyNum}>{cartItem.quantity}</Text>
              <TouchableOpacity style={card.qtyBtn} onPress={() => onIncrease(item.id)}>
                <Ionicons name="add" size={14} color={WHITE} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={card.addBtn} onPress={() => onAdd(item)}>
              <Ionicons name="add" size={16} color={WHITE} />
              <Text style={card.addText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const { category, highlight } = useLocalSearchParams<{ category: string; highlight: string }>();

  const resolvedFamily = Array.isArray(highlight) ? highlight[0] : highlight ?? "";
  const resolvedCategory = Array.isArray(category) ? category[0] : category ?? "food";

  const [searchQuery, setSearchQuery] = useState("");
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible,   setCheckoutVisible]   = useState(false);
  const [cart, setCart] = useState<CartProduct[]>(() => cartStore.getItems());

  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [conflictMsg,    setConflictMsg]    = useState("");
  const insets = useSafeAreaInsets();

  const sync = useCallback(() => setCart(cartStore.getItems()), []);

  useEffect(() => {
    cartStore.load();         
    cartStore.addListener(sync);
    return () => cartStore.removeListener(sync);
  }, [sync]);
  
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const displayed = useMemo(() => {
    const byFamily = ALL_PRODUCTS.filter((p) => p.family === resolvedFamily);
    if (!searchQuery.trim()) return byFamily;
    return byFamily.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resolvedFamily, searchQuery]);

  const handleAdd = (item: Product) => {
      const result = cartStore.tryAdd(item);
  
      if (result === "added") return;
  
      const scope = cartStore.getCartScope()!;
      if (result === "wrong_family") {
        setConflictMsg(
          `Your cart has items from "${scope.family}". Adding "${item.name}" will remove them.`
        );
      } else {
        setConflictMsg(
          `Your cart has items from the "${scope.category}" section. Adding "${item.name}" will clear your cart.`
        );
      }
      setPendingProduct(item);
    };
  
    const confirmReplace = () => {
      if (pendingProduct) {
        cartStore.replaceAndAdd(pendingProduct);
      }
      setPendingProduct(null);
      setConflictMsg("");
    };
  
    const cancelReplace = () => {
      setPendingProduct(null);
      setConflictMsg("");
    };

    const handleCheckout = () => {
      setCartVisible(false);
      setTimeout(() => setCheckoutVisible(true));
    };
  
    const getCartItem = (id: string) => cart.find((i) => i.id === id);
  
  return (
    <View style={styles.root}>
      <StatusBar 
        translucent={Platform.OS === 'ios'} 
        backgroundColor={Platform.OS === 'android' ? WHITE : 'transparent'} 
        barStyle="dark-content" 
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{resolvedFamily}</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartVisible(true)}>
          <Ionicons name="bag-sharp" size={22} color={WHITE} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${resolvedFamily}...`}
          placeholderTextColor="#BBB"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#CCC" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {displayed.length > 0 ? (
          displayed.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              cartItem={getCartItem(item.id)}
              onAdd={handleAdd}
              onIncrease={(id) => cartStore.increase(id)}
              onDecrease={(id) => cartStore.decrease(id)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🍽️</Text>
            <Text style={styles.emptyTitle}>Nothing found</Text>
            <Text style={styles.emptySub}>Try a different search</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {totalItems > 0 && (
        <TouchableOpacity  style={[styles.floatingCart, { bottom: Math.max(insets.bottom + 12, 24) }]} onPress={() => setCartVisible(true)}>
          <View style={styles.floatingLeft}>
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.floatingLabel}>View Cart</Text>
          </View>
          <Text style={styles.floatingTotal}>
            ₦{cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}

      <CartSheet
        visible={cartVisible}
        cart={cart}
        onClose={() => setCartVisible(false)}
        onIncrease={(id) => cartStore.increase(id)}
        onDecrease={(id) => cartStore.decrease(id)}
        onRemove={(id) => cartStore.remove(id)}
        onCheckout={handleCheckout}
      />

      <ConflictModal
        visible={!!pendingProduct}
        message={conflictMsg}
        onReplace={confirmReplace}
        onCancel={cancelReplace}
      />

      <Modal
        visible={checkoutVisible}
        animationType="slide"
        statusBarTranslucent 
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <CheckoutScreen onClose={() => setCheckoutVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: WHITE, paddingTop: 50

  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BLACK, flex: 1, textAlign: "center" },
  cartBtn: {
    backgroundColor: ORANGE, width: 42, height: 42,
    borderRadius: 13, alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4, backgroundColor: BLACK,
    width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: WHITE, fontSize: 10, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: WHITE,
    marginHorizontal: 20, marginVertical: 12, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: BLACK },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: BLACK, marginTop: 12 },
  emptySub: { fontSize: 14, color: "#999", marginTop: 4 },
  floatingCart: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    backgroundColor: ORANGE, borderRadius: 16, paddingHorizontal: 20,
    paddingVertical: 14, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", shadowColor: ORANGE,
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,marginBottom: 15
  },
  floatingLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  floatingBadge: {
    backgroundColor: WHITE, width: 26, height: 26,
    borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  floatingBadgeText: { color: ORANGE, fontSize: 13, fontWeight: "700" },
  floatingLabel: { color: WHITE, fontSize: 15, fontWeight: "700" },
  floatingTotal: { color: WHITE, fontSize: 15, fontWeight: "700" },
});

const card = StyleSheet.create({
  wrap: {
    flexDirection: "row", backgroundColor: WHITE, borderRadius: 18,
    marginBottom: 14, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { width: 110, height: 110 },
  image: { width: "100%", height: "100%" },
  tag: { position: "absolute", top: 8, left: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { color: WHITE, fontSize: 10, fontWeight: "700" },
  info: { flex: 1, padding: 12, justifyContent: "space-between" },
  name: { fontSize: 15, fontWeight: "700", color: BLACK },
  desc: { fontSize: 12, color: "#999", lineHeight: 17, marginTop: 2 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  price: { fontSize: 15, fontWeight: "700", color: ORANGE },
  addBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: ORANGE,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 2,
  },
  heartBtn: {
    position: "absolute", top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  addText: { color: WHITE, fontSize: 13, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: ORANGE, borderRadius: 10, overflow: "hidden" },
  qtyBtn: { padding: 6, paddingHorizontal: 8 },
  qtyNum: { color: WHITE, fontSize: 14, fontWeight: "700", paddingHorizontal: 4 },
});

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  container: {
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "75%",
  },
  handle: { width: 40, height: 4, backgroundColor: "#EEE", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  title: { fontSize: 20, fontWeight: "700", color: BLACK, marginBottom: 16 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  itemName: { fontSize: 14, fontWeight: "600", color: BLACK },
  itemPrice: { fontSize: 13, color: ORANGE, fontWeight: "700", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1.5,
    borderColor: ORANGE, alignItems: "center", justifyContent: "center",
  },
  qtyNum: { fontSize: 14, fontWeight: "700", color: BLACK, minWidth: 20, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: BLACK },
  totalAmount: { fontSize: 16, fontWeight: "700", color: ORANGE },
  checkoutBtn: { backgroundColor: ORANGE, borderRadius: 100, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  checkoutText: { color: WHITE, fontSize: 16, fontWeight: "700" },
});

const conflict = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  box: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28,
  },
  title: { fontSize: 18, fontWeight: "700", color: BLACK, marginBottom: 10 },
  body:  { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 24 },
  row:   { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#DDD", alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: BLACK },
  replaceBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: ORANGE, alignItems: "center",
  },
  replaceText: { fontSize: 15, fontWeight: "700", color: WHITE },
});

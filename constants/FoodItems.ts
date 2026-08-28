export type Category = { id: string; label: string; emoji: string };

export type FoodItem = {
  id: string;
  name: string;
  image: { uri: string };
  category: string;
};

export const CATEGORIES: Category[] = [
  { id: "food",    label: "Food",    emoji: "🍔" },
  { id: "snacks",  label: "Snacks",  emoji: "🍟" },
  { id: "dessert", label: "Dessert", emoji: "🍦" },
  { id: "drinks",  label: "Drinks",  emoji: "🥤" },
];

export const ALL_ITEMS: FoodItem[] = [
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
    image: { uri: "https://plus.unsplash.com/premium_photo-1695868328902-b8a3b093da74?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    category: "drinks",
  },
];
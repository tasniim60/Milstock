const unitPrices = {
  Rice: 4,
  Pasta: 5,
  Sugar: 3,
  Flour: 2.5,
  'Cooking Oil': 12,
  Beans: 6,
  Lentils: 5.5,
  'Canned Tuna': 8,
  'Tomato Sauce': 4,
  'Water Bottles': 1,
  'Apple Juice': 5,
  'Orange Juice': 6,
  Tea: 18,
  Salt: 1.5,
  Milk: 6,
  Cheese: 15,
  Yogurt: 3,
  Butter: 12,
  Eggs: 0.8,
  'Frozen Vegetables': 7,
  Chicken: 14,
  Beef: 28,
  'Fresh Vegetables': 5,
  'Fresh Fruits': 7,
  Potatoes: 3,
  Tomatoes: 4,
  Onions: 2.5,
  Apples: 6,
  Bananas: 5,
  Bread: 1.5,
  Oats: 7,
  Corn: 4,
  Chickpeas: 5,
  Honey: 25,
  Jam: 8,
  Coffee: 35,
  'Fish Fillets': 22,
  Shrimp: 30,
  Cream: 9,
  Lettuce: 4,
  Cucumbers: 3,
  Carrots: 3,
  Oranges: 5,
  Mangoes: 8,
  Dates: 12,
  'Chocolate Spread': 10,
  Cereal: 12,
  Croissants: 2,
  'Grape Juice': 6,
  'Sparkling Water': 1.5,
  'Canned Beans': 6,
  'Olive Oil': 18,
  'Sunflower Oil': 11,
  'Powdered Milk': 10,
  'Tomato Paste': 5,
  'White Cheese': 14,
  Labneh: 9,
  'Frozen Fish': 20,
  'Frozen Chicken Nuggets': 16,
  'Green Peas': 5,
  Zucchini: 4,
  Eggplant: 4,
  Pears: 7,
  'Pita Bread': 1,
  'Burger Buns': 1.2,
  'Mineral Water': 1,
  'Lemon Juice': 6,
  'Iced Tea': 5,
};

const normalize = (value) => String(value || '').trim().toLowerCase();

const getCategoryFallbackPrice = (category) => {
  const normalized = normalize(category);
  if (normalized.includes('frozen')) return 12;
  if (normalized.includes('dairy')) return 8;
  if (normalized.includes('beverage')) return 4;
  if (normalized.includes('bakery')) return 3;
  if (normalized.includes('fresh')) return 5;
  if (normalized.includes('canned')) return 6;
  if (normalized.includes('oil')) return 12;
  if (normalized.includes('grain')) return 4;
  if (normalized.includes('legume')) return 5;
  return 1;
};

const getEffectiveProductUnitPrice = (product) => {
  const storedPrice = Number(product?.unit_price ?? product?.price ?? product?.cost ?? product?.purchase_price ?? product?.supplier_price ?? 0);
  if (storedPrice > 0) return storedPrice;

  const exact = unitPrices[product?.name] || unitPrices[product?.nameAr];
  if (exact) return exact;

  const normalizedName = normalize(product?.name);
  const nameMatch = Object.entries(unitPrices).find(([knownName]) => normalize(knownName) === normalizedName);
  if (nameMatch) return nameMatch[1];

  return getCategoryFallbackPrice(product?.category);
};

module.exports = {
  getEffectiveProductUnitPrice,
  unitPrices,
};

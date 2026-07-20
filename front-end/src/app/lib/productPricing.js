const productUnitPrices = {
  Rice: 4,
  "أرز": 4,
  Pasta: 5,
  "مكرونة": 5,
  Sugar: 3,
  "سكر": 3,
  Flour: 2.5,
  "دقيق": 2.5,
  "Cooking Oil": 12,
  "زيت طهي": 12,
  Beans: 6,
  "فول": 6,
  Lentils: 5.5,
  "عدس": 5.5,
  "Canned Tuna": 8,
  "تونة معلبة": 8,
  "Tomato Sauce": 4,
  "صلصة طماطم": 4,
  "Water Bottles": 1,
  "زجاجات مياه": 1,
  "Apple Juice": 5,
  "عصير تفاح": 5,
  "Orange Juice": 6,
  "عصير برتقال": 6,
  Tea: 18,
  "شاي": 18,
  Salt: 1.5,
  "ملح": 1.5,
  Milk: 6,
  "حليب": 6,
  Cheese: 15,
  "جبن": 15,
  Yogurt: 3,
  "زبادي": 3,
  Butter: 12,
  "زبدة": 12,
  Eggs: 0.8,
  "بيض": 0.8,
  "Frozen Vegetables": 7,
  "خضروات مجمدة": 7,
  Chicken: 14,
  "دجاج": 14,
  Beef: 28,
  "لحمة": 28,
  "Fresh Vegetables": 5,
  "خضروات طازجة": 5,
  "Fresh Fruits": 7,
  "فواكه طازجة": 7,
  Potatoes: 3,
  "بطاطس": 3,
  Tomatoes: 4,
  "طماطم": 4,
  Onions: 2.5,
  "بصل": 2.5,
  Apples: 6,
  "تفاح": 6,
  Bananas: 5,
  "موز": 5,
  Bread: 1.5,
  "خبز": 1.5,
  Oats: 7,
  "شوفان": 7,
  Corn: 4,
  "ذرة": 4,
  Chickpeas: 5,
  "حمص": 5,
  Honey: 25,
  "عسل": 25,
  Jam: 8,
  "مربى": 8,
  Coffee: 35,
  "قهوة": 35,
  "Fish Fillets": 22,
  "فيليه سمك": 22,
  Shrimp: 30,
  "جمبري": 30,
  Cream: 9,
  "كريمة": 9,
  Lettuce: 4,
  "خس": 4,
  Cucumbers: 3,
  "خيار": 3,
  Carrots: 3,
  "جزر": 3,
  Oranges: 5,
  "برتقال": 5,
  Mangoes: 8,
  "مانجو": 8,
  Dates: 12,
  "تمر": 12,
  "Chocolate Spread": 10,
  "كريمة شوكولاتة": 10,
  Cereal: 12,
  "حبوب إفطار": 12,
  Croissants: 2,
  "كرواسون": 2,
  "Grape Juice": 6,
  "عصير عنب": 6,
  "Sparkling Water": 1.5,
  "مياه غازية": 1.5,
  "Canned Beans": 6,
  "فاصوليا معلبة": 6,
  "Olive Oil": 18,
  "زيت زيتون": 18,
  "Sunflower Oil": 11,
  "زيت عباد الشمس": 11,
  "Powdered Milk": 10,
  "حليب بودرة": 10,
  "Tomato Paste": 5,
  "معجون طماطم": 5,
  "White Cheese": 14,
  "جبنة بيضاء": 14,
  Labneh: 9,
  "لبنة": 9,
  "Frozen Fish": 20,
  "سمك مجمد": 20,
  "Frozen Chicken Nuggets": 16,
  "ناجتس دجاج مجمد": 16,
  "Green Peas": 5,
  "بازلاء خضراء": 5,
  Zucchini: 4,
  "كوسة": 4,
  Eggplant: 4,
  "باذنجان": 4,
  Pears: 7,
  "كمثرى": 7,
  "Pita Bread": 1,
  "خبز عربي": 1,
  "Burger Buns": 1.2,
  "خبز برجر": 1.2,
  "Mineral Water": 1,
  "مياه معدنية": 1,
  "Lemon Juice": 6,
  "عصير ليمون": 6,
  "Iced Tea": 5,
  "شاي مثلج": 5,
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const categoryFallbackPrice = (category) => {
  const normalized = normalize(category);
  if (normalized.includes("frozen") || normalized.includes("مجمدة")) return 12;
  if (normalized.includes("dairy") || normalized.includes("ألبان")) return 8;
  if (normalized.includes("beverage") || normalized.includes("مشروبات")) return 4;
  if (normalized.includes("bakery") || normalized.includes("مخبوزات")) return 3;
  if (normalized.includes("fresh") || normalized.includes("طازجة")) return 5;
  if (normalized.includes("canned") || normalized.includes("معلبة")) return 6;
  if (normalized.includes("oil") || normalized.includes("زيوت")) return 12;
  if (normalized.includes("grain") || normalized.includes("حبوب")) return 4;
  if (normalized.includes("legume") || normalized.includes("بقوليات")) return 5;
  return 1;
};

export const getEffectiveProductUnitPrice = (product) => {
  const stored = Number(product?.unit_price ?? product?.price ?? product?.cost ?? product?.purchase_price ?? product?.supplier_price ?? 0);
  if (stored > 0) return stored;

  const exact = productUnitPrices[product?.name] || productUnitPrices[product?.nameAr];
  if (exact) return exact;

  const normalizedName = normalize(product?.name);
  const normalizedNameAr = normalize(product?.nameAr);
  const match = Object.entries(productUnitPrices).find(([name]) => {
    const normalizedKnown = normalize(name);
    return normalizedKnown === normalizedName || normalizedKnown === normalizedNameAr;
  });
  if (match) return match[1];

  return categoryFallbackPrice(product?.category || product?.categoryAr);
};

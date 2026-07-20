const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/productModel');

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

const getFallbackPrice = (product) => {
  const exact = unitPrices[product.name] || unitPrices[product.nameAr];
  if (exact) return exact;

  const name = normalize(product.name);
  const match = Object.entries(unitPrices).find(([knownName]) => normalize(knownName) === name);
  if (match) return match[1];

  const category = normalize(product.category);
  if (category.includes('frozen')) return 12;
  if (category.includes('dairy')) return 8;
  if (category.includes('beverage')) return 4;
  if (category.includes('bakery')) return 3;
  if (category.includes('fresh')) return 5;
  if (category.includes('canned')) return 6;
  if (category.includes('oil')) return 12;
  if (category.includes('grain')) return 4;
  return 1;
};

const run = async () => {
  await connectDB();

  const products = await Product.find({
    $or: [
      { unit_price: { $exists: false } },
      { unit_price: null },
      { unit_price: { $lte: 0 } },
    ],
  });

  let updated = 0;
  for (const product of products) {
    product.unit_price = getFallbackPrice(product);
    await product.save();
    updated += 1;
  }

  console.log('Product price backfill complete.');
  console.log(`Products checked: ${products.length}`);
  console.log(`Products updated: ${updated}`);
};

run()
  .catch((error) => {
    console.error('Product price backfill failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

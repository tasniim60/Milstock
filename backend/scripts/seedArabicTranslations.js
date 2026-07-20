const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const Warehouse = require('../models/warehouseModel');
const User = require('../models/userModel');

const productArabicNames = {
  'Canned Tuna': { nameAr: 'تونة معلبة', categoryAr: 'أغذية معلبة' },
  'Frozen Vegetables': { nameAr: 'خضروات مجمدة', categoryAr: 'أغذية مجمدة' },
  'Water Bottles': { nameAr: 'زجاجات مياه', categoryAr: 'مشروبات' },
  Bread: { nameAr: 'خبز', categoryAr: 'مخبوزات' },
  Milk: { nameAr: 'حليب', categoryAr: 'ألبان' },
  Cheese: { nameAr: 'جبن', categoryAr: 'ألبان' },
  Sugar: { nameAr: 'سكر', categoryAr: 'مواد جافة' },
  Rice: { nameAr: 'أرز', categoryAr: 'مواد جافة' },
  Pasta: { nameAr: 'مكرونة', categoryAr: 'مواد جافة' },
  'Cooking Oil': { nameAr: 'زيت طهي', categoryAr: 'مواد جافة' },
  Beans: { nameAr: 'فول', categoryAr: 'مواد جافة' },
  'Fresh Fruits': { nameAr: 'فواكه طازجة', categoryAr: 'منتجات طازجة' },
  'Fresh Vegetables': { nameAr: 'خضروات طازجة', categoryAr: 'منتجات طازجة' },
  Lentils: { nameAr: 'عدس', categoryAr: 'بقوليات' },
  Flour: { nameAr: 'دقيق', categoryAr: 'مخبوزات' },
  Yogurt: { nameAr: 'زبادي', categoryAr: 'ألبان' },
  'Tomato Sauce': { nameAr: 'صلصة طماطم', categoryAr: 'أغذية معلبة' },
  'Apple Juice': { nameAr: 'عصير تفاح', categoryAr: 'مشروبات' },
  Chicken: { nameAr: 'دجاج', categoryAr: 'أغذية مجمدة' },
  Beef: { nameAr: 'لحمة', categoryAr: 'أغذية مجمدة' },
  Eggs: { nameAr: 'بيض', categoryAr: 'ألبان' },
  Butter: { nameAr: 'زبدة', categoryAr: 'ألبان' },
  Potatoes: { nameAr: 'بطاطس', categoryAr: 'منتجات طازجة' },
  Tomatoes: { nameAr: 'طماطم', categoryAr: 'منتجات طازجة' },
  Onions: { nameAr: 'بصل', categoryAr: 'منتجات طازجة' },
  Apples: { nameAr: 'تفاح', categoryAr: 'منتجات طازجة' },
  Bananas: { nameAr: 'موز', categoryAr: 'منتجات طازجة' },
  'Orange Juice': { nameAr: 'عصير برتقال', categoryAr: 'مشروبات' },
  Tea: { nameAr: 'شاي', categoryAr: 'مواد جافة' },
  Salt: { nameAr: 'ملح', categoryAr: 'مواد جافة' },
  Oats: { nameAr: 'شوفان', categoryAr: 'حبوب' },
  Corn: { nameAr: 'ذرة', categoryAr: 'حبوب' },
  Chickpeas: { nameAr: 'حمص', categoryAr: 'بقوليات' },
  Honey: { nameAr: 'عسل', categoryAr: 'مواد جافة' },
  Jam: { nameAr: 'مربى', categoryAr: 'أغذية معلبة' },
  Coffee: { nameAr: 'قهوة', categoryAr: 'مواد جافة' },
  'Fish Fillets': { nameAr: 'فيليه سمك', categoryAr: 'أغذية مجمدة' },
  Shrimp: { nameAr: 'جمبري', categoryAr: 'أغذية مجمدة' },
  Cream: { nameAr: 'كريمة', categoryAr: 'ألبان' },
  Lettuce: { nameAr: 'خس', categoryAr: 'منتجات طازجة' },
  Cucumbers: { nameAr: 'خيار', categoryAr: 'منتجات طازجة' },
  Carrots: { nameAr: 'جزر', categoryAr: 'منتجات طازجة' },
  Oranges: { nameAr: 'برتقال', categoryAr: 'منتجات طازجة' },
  Mangoes: { nameAr: 'مانجو', categoryAr: 'منتجات طازجة' },
  Dates: { nameAr: 'تمر', categoryAr: 'مواد جافة' },
  'Chocolate Spread': { nameAr: 'كريمة شوكولاتة', categoryAr: 'مخبوزات' },
  Cereal: { nameAr: 'حبوب إفطار', categoryAr: 'حبوب' },
  Croissants: { nameAr: 'كرواسون', categoryAr: 'مخبوزات' },
  'Grape Juice': { nameAr: 'عصير عنب', categoryAr: 'مشروبات' },
  'Sparkling Water': { nameAr: 'مياه غازية', categoryAr: 'مشروبات' },
};

const warehouseArabicNames = {
  'Dry Goods Warehouse': {
    nameAr: 'مخزن المواد الجافة',
    locationAr: 'منطقة التخزين الرئيسية أ',
  },
  'Cold Storage Warehouse': {
    nameAr: 'مخزن التبريد',
    locationAr: 'منطقة التبريد ب',
  },
  'Bakery Supplies Warehouse': {
    nameAr: 'مخزن مستلزمات المخبوزات',
    locationAr: 'منطقة تخزين المخبوزات والأغذية المعبأة',
  },
  'Fresh Produce Warehouse': {
    nameAr: 'مخزن المنتجات الطازجة',
    locationAr: 'منطقة تخزين الأغذية الطازجة',
  },
};

const userArabicNames = {
  'Kitchen Request Coordinator': { nameAr: 'منسق طلبات المطبخ' },
  'Food Inventory Admin': { nameAr: 'مسؤول مخزون الأغذية' },
  'Seed Admin': { nameAr: 'مسؤول البيانات التجريبية' },
  'Fresh Food Supplier': { nameAr: 'مورد الأغذية الطازجة' },
  'Dairy Supplier': { nameAr: 'مورد الألبان' },
  'Warehouse Supervisor': { nameAr: 'مشرف المخزن' },
  'Prime Food Supplier': { nameAr: 'مورد الأغذية الرئيسي' },
  'Bakery Supplier': { nameAr: 'مورد المخبوزات' },
  'Beverage Supplier': { nameAr: 'مورد المشروبات' },
  'Frozen Food Supplier': { nameAr: 'مورد الأغذية المجمدة' },
  'Grain Supplier': { nameAr: 'مورد الحبوب' },
  'Canned Food Supplier': { nameAr: 'مورد الأغذية المعلبة' },
  'Fresh Produce Supplier': { nameAr: 'مورد المنتجات الطازجة' },
  'Meat and Poultry Supplier': { nameAr: 'مورد اللحوم والدواجن' },
  'Oils and Condiments Supplier': { nameAr: 'مورد الزيوت والتوابل' },
};

const applyTranslations = async (Model, mapping) => {
  let updated = 0;
  let skipped = 0;

  for (const [name, translations] of Object.entries(mapping)) {
    const doc = await Model.findOne({ name });
    if (!doc) {
      skipped += 1;
      continue;
    }

    const updates = {};
    for (const [field, value] of Object.entries(translations)) {
      if (!doc[field]) updates[field] = value;
    }

    if (Object.keys(updates).length) {
      await Model.updateOne({ _id: doc._id }, { $set: updates });
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { updated, skipped };
};

const run = async () => {
  try {
    await connectDB();
    const productResult = await applyTranslations(Product, productArabicNames);
    const warehouseResult = await applyTranslations(Warehouse, warehouseArabicNames);
    const userResult = await applyTranslations(User, userArabicNames);

    console.log('Arabic translation seed complete.');
    console.log(`Products updated: ${productResult.updated}, skipped: ${productResult.skipped}`);
    console.log(`Warehouses updated: ${warehouseResult.updated}, skipped: ${warehouseResult.skipped}`);
    console.log(`Users updated: ${userResult.updated}, skipped: ${userResult.skipped}`);
  } catch (error) {
    console.error('Arabic translation seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const Warehouse = require('../models/warehouseModel');
const Supplier = require('../models/supplierModel');
const Notification = require('../models/notificationModel');

const daysFromToday = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const warehouses = [
  {
    code: 'WH-DRY',
    name: 'Dry Goods Warehouse',
    nameAr: 'مخزن المواد الجافة',
    location: 'Central Food Depot - Aisle 1',
    locationAr: 'مستودع الأغذية المركزي - ممر 1',
    capacity: 50000,
  },
  {
    code: 'WH-COLD',
    name: 'Cold Storage Warehouse',
    nameAr: 'مخزن التبريد',
    location: 'Central Food Depot - Refrigerated Zone',
    locationAr: 'مستودع الأغذية المركزي - منطقة التبريد',
    capacity: 20000,
  },
  {
    code: 'WH-FRESH',
    name: 'Fresh Produce Warehouse',
    nameAr: 'مخزن المنتجات الطازجة',
    location: 'Distribution Center - Produce Hall',
    locationAr: 'مركز التوزيع - قاعة المنتجات الطازجة',
    capacity: 18000,
  },
  {
    code: 'WH-BAKERY',
    name: 'Bakery Supplies Warehouse',
    nameAr: 'مخزن مستلزمات المخبوزات',
    location: 'Central Food Depot - Bakery Supplies Zone',
    locationAr: 'مستودع الأغذية المركزي - منطقة مستلزمات المخبوزات',
    capacity: 15000,
  },
  {
    code: 'WH-BEV',
    name: 'Beverages Warehouse',
    nameAr: 'مخزن المشروبات',
    location: 'Central Food Depot - Beverage Storage',
    locationAr: 'مستودع الأغذية المركزي - تخزين المشروبات',
    capacity: 22000,
  },
];

const products = [
  ['Rice', 'أرز', 'Grains', 'حبوب', 4200, 'kg', 800, 'WH-DRY', '2027-12-31'],
  ['Pasta', 'مكرونة', 'Grains', 'حبوب', 1800, 'kg', 400, 'WH-DRY', '2027-08-15'],
  ['Sugar', 'سكر', 'Baking', 'مخبوزات', 1200, 'kg', 300, 'WH-BAKERY', '2028-02-28'],
  ['Flour', 'دقيق', 'Baking', 'مخبوزات', 1650, 'kg', 500, 'WH-BAKERY', '2026-11-30'],
  ['Cooking Oil', 'زيت طهي', 'Oils', 'زيوت', 750, 'liter', 250, 'WH-DRY', '2027-05-31'],
  ['Beans', 'فول', 'Legumes', 'بقوليات', 1600, 'kg', 350, 'WH-DRY', '2027-09-30'],
  ['Lentils', 'عدس', 'Legumes', 'بقوليات', 1450, 'kg', 350, 'WH-DRY', '2027-09-30'],
  ['Canned Tuna', 'تونة معلبة', 'Canned Food', 'أغذية معلبة', 2400, 'piece', 600, 'WH-DRY', '2028-04-30'],
  ['Tomato Sauce', 'صلصة طماطم', 'Canned Food', 'أغذية معلبة', 850, 'piece', 180, 'WH-DRY', daysFromToday(30)],
  ['Water Bottles', 'زجاجات مياه', 'Beverages', 'مشروبات', 6000, 'piece', 1200, 'WH-BEV', '2028-01-31'],
  ['Apple Juice', 'عصير تفاح', 'Beverages', 'مشروبات', 1100, 'piece', 220, 'WH-BEV', daysFromToday(90)],
  ['Orange Juice', 'عصير برتقال', 'Beverages', 'مشروبات', 920, 'liter', 200, 'WH-BEV', daysFromToday(120)],
  ['Tea', 'شاي', 'Dry Goods', 'مواد جافة', 360, 'kg', 90, 'WH-DRY', '2028-07-31'],
  ['Salt', 'ملح', 'Dry Goods', 'مواد جافة', 1500, 'kg', 250, 'WH-DRY', '2029-01-31'],
  ['Milk', 'حليب', 'Dairy', 'ألبان', 620, 'liter', 300, 'WH-COLD', '2026-07-10'],
  ['Cheese', 'جبن', 'Dairy', 'ألبان', 380, 'kg', 120, 'WH-COLD', '2026-10-05'],
  ['Yogurt', 'زبادي', 'Dairy', 'ألبان', 320, 'piece', 100, 'WH-COLD', daysFromToday(7)],
  ['Butter', 'زبدة', 'Dairy', 'ألبان', 420, 'kg', 120, 'WH-COLD', daysFromToday(75)],
  ['Eggs', 'بيض', 'Dairy', 'ألبان', 1800, 'piece', 400, 'WH-COLD', daysFromToday(18)],
  ['Frozen Vegetables', 'خضروات مجمدة', 'Frozen Food', 'أغذية مجمدة', 900, 'kg', 300, 'WH-COLD', '2026-12-15'],
  ['Chicken', 'دجاج', 'Frozen Food', 'أغذية مجمدة', 760, 'kg', 250, 'WH-COLD', daysFromToday(45)],
  ['Beef', 'لحمة', 'Frozen Food', 'أغذية مجمدة', 540, 'kg', 180, 'WH-COLD', daysFromToday(60)],
  ['Fresh Vegetables', 'خضروات طازجة', 'Fresh Produce', 'منتجات طازجة', 700, 'kg', 250, 'WH-FRESH', '2026-06-20'],
  ['Fresh Fruits', 'فواكه طازجة', 'Fresh Produce', 'منتجات طازجة', 640, 'kg', 240, 'WH-FRESH', '2026-06-18'],
  ['Potatoes', 'بطاطس', 'Fresh Produce', 'منتجات طازجة', 1300, 'kg', 300, 'WH-FRESH', daysFromToday(22)],
  ['Tomatoes', 'طماطم', 'Fresh Produce', 'منتجات طازجة', 820, 'kg', 220, 'WH-FRESH', daysFromToday(9)],
  ['Onions', 'بصل', 'Fresh Produce', 'منتجات طازجة', 1150, 'kg', 260, 'WH-FRESH', daysFromToday(35)],
  ['Apples', 'تفاح', 'Fresh Produce', 'منتجات طازجة', 980, 'kg', 250, 'WH-FRESH', daysFromToday(16)],
  ['Bananas', 'موز', 'Fresh Produce', 'منتجات طازجة', 620, 'kg', 180, 'WH-FRESH', daysFromToday(6)],
  ['Bread', 'خبز', 'Bakery', 'مخبوزات', 1000, 'piece', 200, 'WH-BAKERY', daysFromToday(5)],
  ['Oats', 'شوفان', 'Grains', 'حبوب', 980, 'kg', 180, 'WH-DRY', '2028-03-31'],
  ['Corn', 'ذرة', 'Grains', 'حبوب', 1250, 'kg', 260, 'WH-DRY', '2027-10-31'],
  ['Chickpeas', 'حمص', 'Legumes', 'بقوليات', 1180, 'kg', 260, 'WH-DRY', '2027-11-30'],
  ['Honey', 'عسل', 'Dry Goods', 'مواد جافة', 460, 'kg', 80, 'WH-DRY', '2029-06-30'],
  ['Jam', 'مربى', 'Canned Food', 'أغذية معلبة', 720, 'piece', 140, 'WH-DRY', '2028-05-31'],
  ['Coffee', 'قهوة', 'Dry Goods', 'مواد جافة', 290, 'kg', 70, 'WH-DRY', '2028-09-30'],
  ['Fish Fillets', 'فيليه سمك', 'Frozen Food', 'أغذية مجمدة', 640, 'kg', 160, 'WH-COLD', daysFromToday(80)],
  ['Shrimp', 'جمبري', 'Frozen Food', 'أغذية مجمدة', 360, 'kg', 90, 'WH-COLD', daysFromToday(70)],
  ['Cream', 'كريمة', 'Dairy', 'ألبان', 310, 'liter', 90, 'WH-COLD', daysFromToday(25)],
  ['Lettuce', 'خس', 'Fresh Produce', 'منتجات طازجة', 420, 'kg', 120, 'WH-FRESH', daysFromToday(4)],
  ['Cucumbers', 'خيار', 'Fresh Produce', 'منتجات طازجة', 780, 'kg', 180, 'WH-FRESH', daysFromToday(8)],
  ['Carrots', 'جزر', 'Fresh Produce', 'منتجات طازجة', 860, 'kg', 190, 'WH-FRESH', daysFromToday(18)],
  ['Oranges', 'برتقال', 'Fresh Produce', 'منتجات طازجة', 1040, 'kg', 240, 'WH-FRESH', daysFromToday(20)],
  ['Mangoes', 'مانجو', 'Fresh Produce', 'منتجات طازجة', 520, 'kg', 130, 'WH-FRESH', daysFromToday(10)],
  ['Dates', 'تمر', 'Dry Goods', 'مواد جافة', 900, 'kg', 180, 'WH-DRY', '2028-12-31'],
  ['Chocolate Spread', 'كريمة شوكولاتة', 'Bakery', 'مخبوزات', 560, 'piece', 120, 'WH-BAKERY', '2028-08-31'],
  ['Cereal', 'حبوب إفطار', 'Grains', 'حبوب', 870, 'box', 160, 'WH-BAKERY', '2028-10-31'],
  ['Croissants', 'كرواسون', 'Bakery', 'مخبوزات', 650, 'piece', 150, 'WH-BAKERY', daysFromToday(3)],
  ['Grape Juice', 'عصير عنب', 'Beverages', 'مشروبات', 760, 'liter', 160, 'WH-BEV', daysFromToday(110)],
  ['Sparkling Water', 'مياه غازية', 'Beverages', 'مشروبات', 2100, 'piece', 420, 'WH-BEV', '2028-02-28'],
  ['Canned Beans', 'فاصوليا معلبة', 'Canned Food', 'أغذية معلبة', 1300, 'piece', 260, 'WH-DRY', '2028-06-30'],
  ['Olive Oil', 'زيت زيتون', 'Oils', 'زيوت', 520, 'liter', 120, 'WH-DRY', '2027-11-30'],
  ['Sunflower Oil', 'زيت عباد الشمس', 'Oils', 'زيوت', 880, 'liter', 180, 'WH-DRY', '2027-10-31'],
  ['Powdered Milk', 'حليب بودرة', 'Dairy', 'ألبان', 740, 'kg', 150, 'WH-DRY', '2028-03-31'],
  ['Tomato Paste', 'معجون طماطم', 'Canned Food', 'أغذية معلبة', 980, 'piece', 220, 'WH-DRY', '2028-01-31'],
  ['White Cheese', 'جبنة بيضاء', 'Dairy', 'ألبان', 430, 'kg', 110, 'WH-COLD', daysFromToday(55)],
  ['Labneh', 'لبنة', 'Dairy', 'ألبان', 360, 'kg', 90, 'WH-COLD', daysFromToday(28)],
  ['Frozen Fish', 'سمك مجمد', 'Frozen Food', 'أغذية مجمدة', 680, 'kg', 160, 'WH-COLD', daysFromToday(95)],
  ['Frozen Chicken Nuggets', 'ناجتس دجاج مجمد', 'Frozen Food', 'أغذية مجمدة', 720, 'kg', 170, 'WH-COLD', daysFromToday(100)],
  ['Green Peas', 'بازلاء خضراء', 'Fresh Produce', 'منتجات طازجة', 540, 'kg', 140, 'WH-FRESH', daysFromToday(14)],
  ['Zucchini', 'كوسة', 'Fresh Produce', 'منتجات طازجة', 610, 'kg', 150, 'WH-FRESH', daysFromToday(7)],
  ['Eggplant', 'باذنجان', 'Fresh Produce', 'منتجات طازجة', 580, 'kg', 150, 'WH-FRESH', daysFromToday(9)],
  ['Pears', 'كمثرى', 'Fresh Produce', 'منتجات طازجة', 460, 'kg', 120, 'WH-FRESH', daysFromToday(15)],
  ['Pita Bread', 'خبز عربي', 'Bakery', 'مخبوزات', 1200, 'piece', 250, 'WH-BAKERY', daysFromToday(4)],
  ['Burger Buns', 'خبز برجر', 'Bakery', 'مخبوزات', 900, 'piece', 180, 'WH-BAKERY', daysFromToday(5)],
  ['Mineral Water', 'مياه معدنية', 'Beverages', 'مشروبات', 3600, 'piece', 700, 'WH-BEV', '2028-04-30'],
  ['Lemon Juice', 'عصير ليمون', 'Beverages', 'مشروبات', 820, 'liter', 180, 'WH-BEV', daysFromToday(105)],
  ['Iced Tea', 'شاي مثلج', 'Beverages', 'مشروبات', 940, 'piece', 200, 'WH-BEV', daysFromToday(140)],
];

const productUnitPrices = {
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

const suppliers = [
  {
    code: 'SUP-FOOD',
    name: 'Fresh Food Supplier',
    nameAr: 'مورد الأغذية الطازجة',
    email: 'supplier.food@milstock.local',
    phone: '+966550010001',
    category: 'Food',
    categoryAr: 'أغذية',
  },
  {
    code: 'SUP-DAIRY',
    name: 'Dairy Supplier',
    nameAr: 'مورد الألبان',
    email: 'supplier.dairy@milstock.local',
    phone: '+966550010002',
    category: 'Dairy',
    categoryAr: 'ألبان',
  },
  {
    code: 'SUP-BAKERY',
    name: 'Bakery Supplier',
    nameAr: 'مورد المخبوزات',
    email: 'supplier.bakery@milstock.local',
    phone: '+966550010003',
    category: 'Bakery',
    categoryAr: 'مخبوزات',
  },
  {
    code: 'SUP-BEV',
    name: 'Beverage Supplier',
    nameAr: 'مورد المشروبات',
    email: 'supplier.beverage@milstock.local',
    phone: '+966550010004',
    category: 'Beverages',
    categoryAr: 'مشروبات',
  },
  {
    code: 'SUP-FROZEN',
    name: 'Frozen Food Supplier',
    nameAr: 'مورد الأغذية المجمدة',
    email: 'supplier.frozen@milstock.local',
    phone: '+966550010005',
    category: 'Frozen Food',
    categoryAr: 'أغذية مجمدة',
  },
  {
    code: 'SUP-GRAIN',
    name: 'Grain Supplier',
    nameAr: 'مورد الحبوب',
    email: 'supplier.grain@milstock.local',
    phone: '+966550010006',
    category: 'Grains',
    categoryAr: 'حبوب',
  },
  {
    code: 'SUP-CANNED',
    name: 'Canned Food Supplier',
    nameAr: 'مورد الأغذية المعلبة',
    email: 'supplier.canned@milstock.local',
    phone: '+966550010007',
    category: 'Canned Food',
    categoryAr: 'أغذية معلبة',
  },
  {
    code: 'SUP-PRODUCE',
    name: 'Fresh Produce Supplier',
    nameAr: 'مورد المنتجات الطازجة',
    email: 'supplier.produce@milstock.local',
    phone: '+966550010008',
    category: 'Fresh Produce',
    categoryAr: 'منتجات طازجة',
  },
  {
    code: 'SUP-MEAT',
    name: 'Meat and Poultry Supplier',
    nameAr: 'مورد اللحوم والدواجن',
    email: 'supplier.meat@milstock.local',
    phone: '+966550010009',
    category: 'Frozen Food',
    categoryAr: 'أغذية مجمدة',
  },
  {
    code: 'SUP-OILS',
    name: 'Oils and Condiments Supplier',
    nameAr: 'مورد الزيوت والتوابل',
    email: 'supplier.oils@milstock.local',
    phone: '+966550010010',
    category: 'Oils',
    categoryAr: 'زيوت',
  },
];

const notifications = [
  {
    notification_key: 'seed-expiry-food-bilingual',
    title: 'Fresh food expiry alert',
    titleAr: 'تنبيه انتهاء صلاحية أغذية طازجة',
    type: 'expiry',
    message: 'Bread and fresh fruit batches are approaching their expiry dates.',
    messageAr: 'دفعات الخبز والفواكه الطازجة تقترب من تاريخ انتهاء الصلاحية.',
    severity: 'warning',
  },
  {
    notification_key: 'seed-low-stock-bilingual',
    title: 'Low stock alert',
    titleAr: 'تنبيه انخفاض المخزون',
    type: 'low_stock',
    message: 'Flour stock is close to the minimum food warehouse threshold.',
    messageAr: 'مخزون الدقيق قريب من الحد الأدنى في مخزن الأغذية.',
    severity: 'critical',
  },
];

const asDate = (value) => (value instanceof Date ? value : new Date(value));

const notificationTranslations = {
  'Fresh food expiry alert': {
    titleAr: 'تنبيه انتهاء صلاحية أغذية طازجة',
    messageAr: 'دفعات الخبز والفواكه الطازجة تقترب من تاريخ انتهاء الصلاحية.',
  },
  'Low stock alert': {
    titleAr: 'تنبيه انخفاض المخزون',
    messageAr: 'مخزون الدقيق قريب من الحد الأدنى في مخزن الأغذية.',
  },
  'Food order created': {
    titleAr: 'تم إنشاء طلب أغذية',
    messageAr: 'طلب جديد للأرز والمكرونة وزيت الطهي في انتظار الموافقة.',
  },
  'Consumption recorded': {
    titleAr: 'تم تسجيل استهلاك',
    messageAr: 'تم تسجيل استهلاك يومي للخبز والحليب والخضروات.',
  },
  'Order status updated': {
    titleAr: 'تم تحديث حالة الطلب',
    messageAr: 'تم تحديث حالة الطلب.',
  },
  'Warehouse request approved': {
    titleAr: 'تمت الموافقة على طلب المخزن',
    messageAr: 'تمت الموافقة على طلب المخزن وهو في انتظار إتمام الحركة.',
  },
};

const run = async () => {
  await connectDB();

  const warehouseByCode = {};
  let warehouseUpserts = 0;
  let productUpserts = 0;
  let stockUpserts = 0;
  let supplierUpserts = 0;
  let notificationUpserts = 0;

  for (const warehouse of warehouses) {
    const doc = await Warehouse.findOneAndUpdate(
      { $or: [{ code: warehouse.code }, { name: warehouse.name }] },
      { $set: { ...warehouse, status: 'active' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    warehouseByCode[warehouse.code] = doc;
    warehouseUpserts += 1;
  }

  for (const [name, nameAr, category, categoryAr, quantity, unit, min_quantity, warehouseCode, expiry] of products) {
    const warehouse = warehouseByCode[warehouseCode];
    const product = await Product.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          nameAr,
          category,
          categoryAr,
          quantity,
          unit,
          min_quantity,
          unit_price: productUnitPrices[name] || 1,
          warehouse_id: warehouse._id,
          warehouse_name: warehouse.name,
          expiry_date: asDate(expiry),
          expiration_date: asDate(expiry),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await ProductWarehouse.findOneAndUpdate(
      { product_id: product._id, warehouse_id: warehouse._id },
      { $set: { quantity } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    productUpserts += 1;
    stockUpserts += 1;
  }

  for (const supplier of suppliers) {
    await Supplier.findOneAndUpdate(
      { $or: [{ code: supplier.code }, { email: supplier.email }] },
      { $set: { ...supplier, status: 'active' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    supplierUpserts += 1;
  }

  for (const notification of notifications) {
    await Notification.findOneAndUpdate(
      { notification_key: notification.notification_key },
      { $set: notification },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    notificationUpserts += 1;
  }

  for (const [title, translation] of Object.entries(notificationTranslations)) {
    const result = await Notification.updateMany(
      { title, $or: [{ titleAr: { $exists: false } }, { titleAr: '' }, { messageAr: { $exists: false } }, { messageAr: '' }] },
      { $set: translation }
    );
    notificationUpserts += result.modifiedCount || 0;
  }

  console.log('Bilingual food dataset seed complete.');
  console.log(`Warehouses upserted: ${warehouseUpserts}`);
  console.log(`Products upserted: ${productUpserts}`);
  console.log(`Product warehouse rows upserted: ${stockUpserts}`);
  console.log(`Suppliers upserted: ${supplierUpserts}`);
  console.log(`Notifications upserted: ${notificationUpserts}`);
};

run()
  .catch((error) => {
    console.error('Bilingual food dataset seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

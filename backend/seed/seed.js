const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Warehouse = require('../models/warehouseModel');
const Product = require('../models/productModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const Supplier = require('../models/supplierModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const Consumption = require('../models/consumptionModel');
const Notification = require('../models/notificationModel');

const password = 'Password123!';
const daysFromToday = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const run = async () => {
  await connectDB();

  console.log('Clearing existing MilStock sample data...');
  await Promise.all([
    Notification.deleteMany({}),
    Consumption.deleteMany({}),
    InventoryMovement.deleteMany({}),
    OrderItem.deleteMany({}),
    Order.deleteMany({}),
    ProductWarehouse.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Warehouse.deleteMany({}),
    User.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash(password, 12);

  const adminUsers = await User.insertMany([
    {
      name: 'Food Inventory Admin',
      nameAr: 'مسؤول مخزون الأغذية',
      email: 'admin@milstock.local',
      password: hashedPassword,
      phone: '+966555000100',
      military_number: 'EMP-0001',
      role: 'admin',
    },
    {
      name: 'Warehouse Supervisor',
      nameAr: 'مشرف المخزن',
      email: 'warehouse@milstock.local',
      password: hashedPassword,
      phone: '+966555000300',
      military_number: 'EMP-0201',
      role: 'admin',
    },
  ]);

  const [adminUser, warehouseUser] = adminUsers;

  const warehouses = await Warehouse.insertMany([
    { name: 'Dry Goods Warehouse', nameAr: 'مخزن المواد الجافة', location: 'Central Food Depot - Aisle 1', locationAr: 'مستودع الأغذية المركزي - الممر 1', user_id: warehouseUser._id },
    { name: 'Cold Storage Warehouse', nameAr: 'مخزن التبريد', location: 'Central Food Depot - Refrigerated Zone', locationAr: 'مستودع الأغذية المركزي - منطقة التبريد', user_id: warehouseUser._id },
    { name: 'Fresh Produce Warehouse', nameAr: 'مخزن المنتجات الطازجة', location: 'Distribution Center - Produce Hall', locationAr: 'مركز التوزيع - صالة المنتجات الطازجة', user_id: adminUser._id },
    { name: 'Bakery Supplies Warehouse', nameAr: 'مخزن مستلزمات المخبوزات', location: 'Central Food Depot - Bakery Supplies Zone', locationAr: 'مستودع الأغذية المركزي - منطقة مستلزمات المخبوزات', user_id: warehouseUser._id },
  ]);

  const kitchenUser = await User.create({
    name: 'Kitchen Request Coordinator',
    nameAr: 'منسق طلبات المطبخ',
    email: 'kitchen@milstock.local',
    password: hashedPassword,
    phone: '+966555000200',
    military_number: 'EMP-0101',
    role: 'unit',
    assigned_warehouse: warehouses[0]._id,
    assigned_warehouse_name: warehouses[0].name,
  });

  const supplierUser = await User.create({
    name: 'Prime Food Supplier',
    nameAr: 'مورد الأغذية الرئيسي',
    email: 'supplier@milstock.local',
    password: hashedPassword,
    phone: '+966555000400',
    military_number: 'EMP-0301',
    role: 'supplier',
  });

  const suppliers = await Supplier.insertMany([
    { name: 'Golden Grain Foods', nameAr: 'مورد الحبوب الذهبية', phone: '+966555100001' },
    { name: 'Fresh Valley Produce', nameAr: 'مورد الوادي الطازج', phone: '+966555100002' },
    { name: 'Pure Dairy Supply', nameAr: 'مورد الألبان النقية', phone: '+966555100003' },
    { name: 'Ocean Canned Foods', nameAr: 'مورد المعلبات البحرية', phone: '+966555100004' },
  ]);

  const products = await Product.insertMany([
    {
      name: 'Rice',
      nameAr: 'أرز',
      quantity: 4200,
      unit: 'kg',
      category: 'Grains',
      categoryAr: 'حبوب',
      min_quantity: 800,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2027-12-31'),
    },
    {
      name: 'Pasta',
      nameAr: 'مكرونة',
      quantity: 1800,
      unit: 'kg',
      category: 'Grains',
      categoryAr: 'حبوب',
      min_quantity: 400,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2027-08-15'),
    },
    {
      name: 'Sugar',
      nameAr: 'سكر',
      quantity: 1200,
      unit: 'kg',
      category: 'Baking',
      categoryAr: 'مخبوزات',
      min_quantity: 300,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2028-02-28'),
    },
    {
      name: 'Flour',
      nameAr: 'دقيق',
      quantity: 950,
      unit: 'kg',
      category: 'Baking',
      categoryAr: 'مخبوزات',
      min_quantity: 500,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2026-11-30'),
    },
    {
      name: 'Cooking Oil',
      nameAr: 'زيت طهي',
      quantity: 750,
      unit: 'liter',
      category: 'Oils',
      categoryAr: 'زيوت',
      min_quantity: 250,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2027-05-31'),
    },
    {
      name: 'Milk',
      nameAr: 'حليب',
      quantity: 620,
      unit: 'liter',
      category: 'Dairy',
      categoryAr: 'ألبان',
      min_quantity: 300,
      warehouse_id: warehouses[1]._id,
      expiry_date: new Date('2026-07-10'),
    },
    {
      name: 'Cheese',
      nameAr: 'جبن',
      quantity: 380,
      unit: 'kg',
      category: 'Dairy',
      categoryAr: 'ألبان',
      min_quantity: 120,
      warehouse_id: warehouses[1]._id,
      expiry_date: new Date('2026-10-05'),
    },
    {
      name: 'Beans',
      nameAr: 'فول',
      quantity: 1600,
      unit: 'kg',
      category: 'Legumes',
      categoryAr: 'بقوليات',
      min_quantity: 350,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2027-09-30'),
    },
    {
      name: 'Lentils',
      nameAr: 'عدس',
      quantity: 1450,
      unit: 'kg',
      category: 'Legumes',
      categoryAr: 'بقوليات',
      min_quantity: 350,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2027-09-30'),
    },
    {
      name: 'Canned Tuna',
      nameAr: 'تونة معلبة',
      quantity: 2400,
      unit: 'piece',
      category: 'Canned Food',
      categoryAr: 'أغذية معلبة',
      min_quantity: 600,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2028-04-30'),
    },
    {
      name: 'Frozen Vegetables',
      nameAr: 'خضروات مجمدة',
      quantity: 900,
      unit: 'kg',
      category: 'Frozen Food',
      categoryAr: 'أغذية مجمدة',
      min_quantity: 300,
      warehouse_id: warehouses[1]._id,
      expiry_date: new Date('2026-12-15'),
    },
    {
      name: 'Fresh Vegetables',
      nameAr: 'خضروات طازجة',
      quantity: 700,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 250,
      warehouse_id: warehouses[2]._id,
      expiry_date: new Date('2026-06-20'),
    },
    {
      name: 'Fresh Fruits',
      nameAr: 'فواكه طازجة',
      quantity: 640,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 240,
      warehouse_id: warehouses[2]._id,
      expiry_date: new Date('2026-06-18'),
    },
    {
      name: 'Bread',
      nameAr: 'خبز',
      quantity: 500,
      unit: 'piece',
      category: 'Bakery',
      categoryAr: 'مخبوزات',
      min_quantity: 200,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(-1),
    },
    {
      name: 'Yogurt',
      nameAr: 'زبادي',
      quantity: 320,
      unit: 'piece',
      category: 'Dairy',
      categoryAr: 'ألبان',
      min_quantity: 100,
      warehouse_id: warehouses[1]._id,
      expiry_date: daysFromToday(7),
    },
    {
      name: 'Tomato Sauce',
      nameAr: 'صلصة طماطم',
      quantity: 850,
      unit: 'piece',
      category: 'Canned Food',
      categoryAr: 'أغذية معلبة',
      min_quantity: 180,
      warehouse_id: warehouses[0]._id,
      expiry_date: daysFromToday(30),
    },
    {
      name: 'Apple Juice',
      nameAr: 'عصير تفاح',
      quantity: 1100,
      unit: 'piece',
      category: 'Beverages',
      categoryAr: 'مشروبات',
      min_quantity: 220,
      warehouse_id: warehouses[0]._id,
      expiry_date: daysFromToday(90),
    },
    {
      name: 'Water Bottles',
      nameAr: 'زجاجات مياه',
      quantity: 6000,
      unit: 'piece',
      category: 'Beverages',
      categoryAr: 'مشروبات',
      min_quantity: 1200,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2028-01-31'),
    },
    {
      name: 'Chicken',
      nameAr: 'دجاج',
      quantity: 760,
      unit: 'kg',
      category: 'Frozen Food',
      categoryAr: 'أغذية مجمدة',
      min_quantity: 250,
      warehouse_id: warehouses[1]._id,
      expiry_date: daysFromToday(45),
    },
    {
      name: 'Beef',
      nameAr: 'لحمة',
      quantity: 540,
      unit: 'kg',
      category: 'Frozen Food',
      categoryAr: 'أغذية مجمدة',
      min_quantity: 180,
      warehouse_id: warehouses[1]._id,
      expiry_date: daysFromToday(60),
    },
    {
      name: 'Eggs',
      nameAr: 'بيض',
      quantity: 1800,
      unit: 'piece',
      category: 'Dairy',
      categoryAr: 'ألبان',
      min_quantity: 400,
      warehouse_id: warehouses[1]._id,
      expiry_date: daysFromToday(18),
    },
    {
      name: 'Butter',
      nameAr: 'زبدة',
      quantity: 420,
      unit: 'kg',
      category: 'Dairy',
      categoryAr: 'ألبان',
      min_quantity: 120,
      warehouse_id: warehouses[1]._id,
      expiry_date: daysFromToday(75),
    },
    {
      name: 'Potatoes',
      nameAr: 'بطاطس',
      quantity: 1300,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 300,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(22),
    },
    {
      name: 'Tomatoes',
      nameAr: 'طماطم',
      quantity: 820,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 220,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(9),
    },
    {
      name: 'Onions',
      nameAr: 'بصل',
      quantity: 1150,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 260,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(35),
    },
    {
      name: 'Apples',
      nameAr: 'تفاح',
      quantity: 980,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 250,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(16),
    },
    {
      name: 'Bananas',
      nameAr: 'موز',
      quantity: 620,
      unit: 'kg',
      category: 'Fresh Produce',
      categoryAr: 'منتجات طازجة',
      min_quantity: 180,
      warehouse_id: warehouses[2]._id,
      expiry_date: daysFromToday(6),
    },
    {
      name: 'Orange Juice',
      nameAr: 'عصير برتقال',
      quantity: 920,
      unit: 'liter',
      category: 'Beverages',
      categoryAr: 'مشروبات',
      min_quantity: 200,
      warehouse_id: warehouses[0]._id,
      expiry_date: daysFromToday(120),
    },
    {
      name: 'Tea',
      nameAr: 'شاي',
      quantity: 360,
      unit: 'kg',
      category: 'Dry Goods',
      categoryAr: 'مواد جافة',
      min_quantity: 90,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2028-07-31'),
    },
    {
      name: 'Salt',
      nameAr: 'ملح',
      quantity: 1500,
      unit: 'kg',
      category: 'Dry Goods',
      categoryAr: 'مواد جافة',
      min_quantity: 250,
      warehouse_id: warehouses[0]._id,
      expiry_date: new Date('2029-01-31'),
    },
  ]);

  const byName = Object.fromEntries(products.map((product) => [product.name, product]));

  await ProductWarehouse.insertMany([
    { product_id: byName.Rice._id, warehouse_id: warehouses[0]._id, quantity: 4200 },
    { product_id: byName.Pasta._id, warehouse_id: warehouses[0]._id, quantity: 1800 },
    { product_id: byName.Sugar._id, warehouse_id: warehouses[0]._id, quantity: 1200 },
    { product_id: byName.Flour._id, warehouse_id: warehouses[0]._id, quantity: 950 },
    { product_id: byName['Cooking Oil']._id, warehouse_id: warehouses[0]._id, quantity: 750 },
    { product_id: byName.Milk._id, warehouse_id: warehouses[1]._id, quantity: 620 },
    { product_id: byName.Cheese._id, warehouse_id: warehouses[1]._id, quantity: 380 },
    { product_id: byName.Beans._id, warehouse_id: warehouses[0]._id, quantity: 1600 },
    { product_id: byName.Lentils._id, warehouse_id: warehouses[0]._id, quantity: 1450 },
    { product_id: byName['Canned Tuna']._id, warehouse_id: warehouses[0]._id, quantity: 2400 },
    { product_id: byName['Frozen Vegetables']._id, warehouse_id: warehouses[1]._id, quantity: 900 },
    { product_id: byName['Fresh Vegetables']._id, warehouse_id: warehouses[2]._id, quantity: 700 },
    { product_id: byName['Fresh Fruits']._id, warehouse_id: warehouses[2]._id, quantity: 640 },
    { product_id: byName.Bread._id, warehouse_id: warehouses[2]._id, quantity: 500 },
    { product_id: byName.Yogurt._id, warehouse_id: warehouses[1]._id, quantity: 320 },
    { product_id: byName['Tomato Sauce']._id, warehouse_id: warehouses[0]._id, quantity: 850 },
    { product_id: byName['Apple Juice']._id, warehouse_id: warehouses[0]._id, quantity: 1100 },
    { product_id: byName['Water Bottles']._id, warehouse_id: warehouses[0]._id, quantity: 6000 },
    { product_id: byName.Chicken._id, warehouse_id: warehouses[1]._id, quantity: 760 },
    { product_id: byName.Beef._id, warehouse_id: warehouses[1]._id, quantity: 540 },
    { product_id: byName.Eggs._id, warehouse_id: warehouses[1]._id, quantity: 1800 },
    { product_id: byName.Butter._id, warehouse_id: warehouses[1]._id, quantity: 420 },
    { product_id: byName.Potatoes._id, warehouse_id: warehouses[2]._id, quantity: 1300 },
    { product_id: byName.Tomatoes._id, warehouse_id: warehouses[2]._id, quantity: 820 },
    { product_id: byName.Onions._id, warehouse_id: warehouses[2]._id, quantity: 1150 },
    { product_id: byName.Apples._id, warehouse_id: warehouses[2]._id, quantity: 980 },
    { product_id: byName.Bananas._id, warehouse_id: warehouses[2]._id, quantity: 620 },
    { product_id: byName['Orange Juice']._id, warehouse_id: warehouses[0]._id, quantity: 920 },
    { product_id: byName.Tea._id, warehouse_id: warehouses[0]._id, quantity: 360 },
    { product_id: byName.Salt._id, warehouse_id: warehouses[0]._id, quantity: 1500 },
    { product_id: byName.Bread._id, warehouse_id: warehouses[3]._id, quantity: 1000 },
    { product_id: byName.Flour._id, warehouse_id: warehouses[3]._id, quantity: 700 },
    { product_id: byName.Sugar._id, warehouse_id: warehouses[3]._id, quantity: 450 },
  ]);

  const orders = await Order.insertMany([
    {
      date: new Date('2026-06-01'),
      total_price: 9600,
      status: 'pending',
      user_id: kitchenUser._id,
      supplier_id: suppliers[0]._id,
    },
    {
      date: new Date('2026-06-02'),
      total_price: 4200,
      status: 'approved',
      user_id: adminUser._id,
      supplier_id: suppliers[2]._id,
    },
    {
      date: new Date('2026-06-03'),
      total_price: 5100,
      status: 'completed',
      user_id: kitchenUser._id,
      supplier_id: suppliers[1]._id,
    },
  ]);

  await OrderItem.insertMany([
    { order_id: orders[0]._id, product_id: byName.Rice._id, quantity: 800, unit_price: 4, total_price: 3200 },
    { order_id: orders[0]._id, product_id: byName.Pasta._id, quantity: 500, unit_price: 5, total_price: 2500 },
    { order_id: orders[0]._id, product_id: byName['Cooking Oil']._id, quantity: 300, unit_price: 13, total_price: 3900 },
    { order_id: orders[1]._id, product_id: byName.Milk._id, quantity: 400, unit_price: 6, total_price: 2400 },
    { order_id: orders[1]._id, product_id: byName.Cheese._id, quantity: 120, unit_price: 15, total_price: 1800 },
    { order_id: orders[2]._id, product_id: byName['Fresh Vegetables']._id, quantity: 450, unit_price: 6, total_price: 2700 },
    { order_id: orders[2]._id, product_id: byName['Fresh Fruits']._id, quantity: 300, unit_price: 8, total_price: 2400 },
  ]);

  await InventoryMovement.insertMany([
    {
      user_id: adminUser._id,
      product_id: byName.Rice._id,
      change_type: 'in',
      stock: 800,
      reference_id: warehouses[0]._id,
      reference_type: 'supplier_delivery',
    },
    {
      user_id: kitchenUser._id,
      product_id: byName.Bread._id,
      change_type: 'out',
      stock: 150,
      reference_id: warehouses[2]._id,
      reference_type: 'daily_kitchen_consumption',
    },
    {
      user_id: warehouseUser._id,
      product_id: byName.Milk._id,
      change_type: 'in',
      stock: 400,
      reference_id: warehouses[1]._id,
      reference_type: 'supplier_delivery',
    },
  ]);

  await Consumption.insertMany([
    { user_id: kitchenUser._id, product_id: byName.Bread._id, warehouse_id: warehouses[2]._id, quantity: 150 },
    { user_id: kitchenUser._id, product_id: byName.Milk._id, warehouse_id: warehouses[1]._id, quantity: 90 },
    { user_id: kitchenUser._id, product_id: byName['Fresh Vegetables']._id, warehouse_id: warehouses[2]._id, quantity: 120 },
  ]);

  await Notification.insertMany([
    {
      title: 'Fresh food expiry alert',
      titleAr: 'تنبيه انتهاء صلاحية أغذية طازجة',
      type: 'expiry',
      message: 'Bread and fresh fruit batches are approaching their expiry dates.',
      messageAr: 'دفعات الخبز والفواكه الطازجة تقترب من تاريخ انتهاء الصلاحية.',
      is_read: false,
      user_id: adminUser._id,
    },
    {
      title: 'Low stock alert',
      titleAr: 'تنبيه انخفاض المخزون',
      type: 'low_stock',
      message: 'Flour stock is close to the minimum food warehouse threshold.',
      messageAr: 'مخزون الدقيق قريب من الحد الأدنى في مخزن الأغذية.',
      is_read: false,
      user_id: warehouseUser._id,
    },
    {
      title: 'Food order created',
      titleAr: 'تم إنشاء طلب أغذية',
      type: 'order',
      message: 'A new rice, pasta, and cooking oil order is pending approval.',
      messageAr: 'طلب جديد للأرز والمكرونة وزيت الطهي في انتظار الموافقة.',
      is_read: false,
      user_id: kitchenUser._id,
    },
    {
      title: 'Consumption recorded',
      titleAr: 'تم تسجيل استهلاك',
      type: 'consumption',
      message: 'Daily bread, milk, and vegetable consumption was recorded.',
      messageAr: 'تم تسجيل استهلاك يومي للخبز والحليب والخضروات.',
      is_read: true,
      user_id: kitchenUser._id,
    },
  ]);

  console.log('MilStock seed complete.');
  console.log(`Demo users: admin@milstock.local / ${password}, kitchen@milstock.local / ${password}`);
};

run()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

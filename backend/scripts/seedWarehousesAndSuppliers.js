const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Warehouse = require('../models/warehouseModel');
const Supplier = require('../models/supplierModel');

const warehouses = [
  {
    name: 'Dry Goods Warehouse',
    code: 'WH-DRY',
    location: 'Main Storage Zone A',
    capacity: 50000,
    status: 'active',
  },
  {
    name: 'Cold Storage Warehouse',
    code: 'WH-COLD',
    location: 'Refrigerated Zone B',
    capacity: 20000,
    status: 'active',
  },
  {
    name: 'Bakery Supplies Warehouse',
    code: 'WH-BAKERY',
    location: 'Bakery and Packaged Food Storage Zone',
    capacity: 15000,
    status: 'active',
  },
  {
    name: 'Fresh Produce Warehouse',
    code: 'WH-FRESH',
    location: 'Fresh Food Storage Zone',
    capacity: 18000,
    status: 'active',
  },
];

const suppliers = [
  {
    name: 'Fresh Food Supplier',
    code: 'SUP-001',
    email: 'supplier.food@milstock.local',
    phone: '+966550010001',
    category: 'Food',
    military_number: 'SUP-001',
  },
  {
    name: 'Dairy Supplier',
    code: 'SUP-002',
    email: 'supplier.dairy@milstock.local',
    phone: '+966550010002',
    category: 'Food',
    military_number: 'SUP-002',
  },
  {
    name: 'Bakery Supplier',
    code: 'SUP-003',
    email: 'supplier.bakery@milstock.local',
    phone: '+966550010003',
    category: 'Bakery',
    military_number: 'SUP-003',
  },
  {
    name: 'Beverage Supplier',
    code: 'SUP-004',
    email: 'supplier.beverage@milstock.local',
    phone: '+966550010004',
    category: 'Beverages',
    military_number: 'SUP-004',
  },
  {
    name: 'Frozen Food Supplier',
    code: 'SUP-005',
    email: 'supplier.frozen@milstock.local',
    phone: '+966550010005',
    category: 'Frozen Food',
    military_number: 'SUP-005',
  },
  {
    name: 'Grain Supplier',
    code: 'SUP-006',
    email: 'supplier.grain@milstock.local',
    phone: '+966550010006',
    category: 'Grains',
    military_number: 'SUP-006',
  },
  {
    name: 'Canned Food Supplier',
    code: 'SUP-007',
    email: 'supplier.canned@milstock.local',
    phone: '+966550010007',
    category: 'Canned Food',
    military_number: 'SUP-007',
  },
  {
    name: 'Fresh Produce Supplier',
    code: 'SUP-008',
    email: 'supplier.produce@milstock.local',
    phone: '+966550010008',
    category: 'Fresh Produce',
    military_number: 'SUP-008',
  },
  {
    name: 'Meat and Poultry Supplier',
    code: 'SUP-009',
    email: 'supplier.meat@milstock.local',
    phone: '+966550010009',
    category: 'Frozen Food',
    military_number: 'SUP-009',
  },
  {
    name: 'Oils and Condiments Supplier',
    code: 'SUP-010',
    email: 'supplier.oils@milstock.local',
    phone: '+966550010010',
    category: 'Oils',
    military_number: 'SUP-010',
  },
];

const ensureSeedAdmin = async () => {
  let admin = await User.findOne({ role: 'admin' }).sort('createdAt');
  if (admin) return admin;

  const password = await bcrypt.hash('Password123!', 12);
  admin = await User.create({
    name: 'Seed Admin',
    email: 'seed.admin@milstock.local',
    password,
    phone: '+966550000000',
    military_number: 'ADM-SEED',
    role: 'admin',
    status: 'active',
  });
  return admin;
};

const seedWarehouses = async (adminId) => {
  let created = 0;
  let skipped = 0;

  for (const warehouse of warehouses) {
    if (warehouse.code === 'WH-BAKERY') {
      const target = await Warehouse.findOne({
        $or: [{ code: warehouse.code }, { name: warehouse.name }],
      });
      const legacyMedical = await Warehouse.findOne({
        $or: [{ code: 'WH-MED' }, { name: 'Medical Supplies Warehouse' }],
      });

      if (legacyMedical && !target) {
        await Warehouse.updateOne({ _id: legacyMedical._id }, { $set: warehouse });
      } else if (legacyMedical && String(legacyMedical._id) !== String(target?._id)) {
        await Warehouse.updateOne(
          { _id: legacyMedical._id },
          { $set: { name: 'Legacy Medical Supplies Warehouse', status: 'inactive' } }
        );
      }
    }

    const existing = await Warehouse.findOne({
      $or: [{ code: warehouse.code }, { name: warehouse.name }],
    });

    if (existing) {
      skipped += 1;
      const updates = {};
      ['code', 'location', 'capacity', 'status'].forEach((field) => {
        if (existing[field] === undefined || existing[field] === null || existing[field] === '') {
          updates[field] = warehouse[field];
        }
      });
      if (!existing.user_id) updates.user_id = adminId;
      if (Object.keys(updates).length) {
        await Warehouse.updateOne({ _id: existing._id }, { $set: updates });
      }
      continue;
    }

    await Warehouse.create({ ...warehouse, user_id: adminId });
    created += 1;
  }

  return { created, skipped };
};

const seedSupplierUsers = async () => {
  let created = 0;
  let skipped = 0;
  const password = await bcrypt.hash('Supplier123!', 12);

  for (const supplier of suppliers) {
    const existing = await User.findOne({
      $or: [{ email: supplier.email }, { military_number: supplier.military_number }],
    });

    if (existing) {
      skipped += 1;
      const updates = {};
      if (existing.role !== 'supplier') updates.role = 'supplier';
      if (existing.status !== 'active') updates.status = 'active';
      if (!existing.phone) updates.phone = supplier.phone;
      if (Object.keys(updates).length) {
        await User.updateOne({ _id: existing._id }, { $set: updates });
      }
      continue;
    }

    await User.create({
      name: supplier.name,
      email: supplier.email,
      password,
      phone: supplier.phone,
      military_number: supplier.military_number,
      role: 'supplier',
      status: 'active',
    });
    created += 1;
  }

  return { created, skipped };
};

const seedSupplierRecords = async () => {
  let created = 0;
  let skipped = 0;

  for (const supplier of suppliers) {
    const existing = await Supplier.findOne({
      $or: [{ code: supplier.code }, { email: supplier.email }],
    });

    if (existing) {
      skipped += 1;
      const updates = {};
      ['code', 'email', 'phone', 'category', 'status'].forEach((field) => {
        const value = field === 'status' ? 'active' : supplier[field];
        if (existing[field] === undefined || existing[field] === null || existing[field] === '') {
          updates[field] = value;
        }
      });
      if (Object.keys(updates).length) {
        await Supplier.updateOne({ _id: existing._id }, { $set: updates });
      }
      continue;
    }

    await Supplier.create({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email,
      phone: supplier.phone,
      category: supplier.category,
      status: 'active',
    });
    created += 1;
  }

  return { created, skipped };
};

const run = async () => {
  try {
    await connectDB();
    const admin = await ensureSeedAdmin();
    const warehouseResult = await seedWarehouses(admin._id);
    const supplierUserResult = await seedSupplierUsers();
    const supplierRecordResult = await seedSupplierRecords();

    console.log('Seed warehouses and suppliers complete.');
    console.log(`Warehouses created: ${warehouseResult.created}, skipped: ${warehouseResult.skipped}`);
    console.log(`Supplier users created: ${supplierUserResult.created}, skipped: ${supplierUserResult.skipped}`);
    console.log(`Supplier records created: ${supplierRecordResult.created}, skipped: ${supplierRecordResult.skipped}`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();

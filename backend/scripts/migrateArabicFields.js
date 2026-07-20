const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const Warehouse = require('../models/warehouseModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

const setMissingOptionalFields = async (Model, fields) => {
  let modified = 0;
  for (const field of fields) {
    const result = await Model.updateMany(
      { [field]: { $exists: false } },
      { $set: { [field]: field === 'params' ? {} : '' } }
    );
    modified += result.modifiedCount || 0;
  }
  return modified;
};

const run = async () => {
  try {
    await connectDB();

    const productModified = await setMissingOptionalFields(Product, [
      'nameAr',
      'categoryAr',
      'descriptionAr',
    ]);
    const warehouseModified = await setMissingOptionalFields(Warehouse, [
      'nameAr',
      'locationAr',
    ]);
    const notificationModified = await setMissingOptionalFields(Notification, [
      'titleAr',
      'messageAr',
      'titleKey',
      'messageKey',
      'params',
    ]);
    const userModified = await setMissingOptionalFields(User, [
      'nameAr',
    ]);

    console.log('Arabic fields migration complete.');
    console.log(`Products updated: ${productModified}`);
    console.log(`Warehouses updated: ${warehouseModified}`);
    console.log(`Notifications updated: ${notificationModified}`);
    console.log(`Users updated: ${userModified}`);
  } catch (error) {
    console.error('Arabic fields migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();

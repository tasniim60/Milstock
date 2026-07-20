const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/productModel');

const run = async () => {
  try {
    await connectDB();
    const products = await Product.find({
      $or: [
        { alert_settings: { $exists: false } },
        { 'alert_settings.low_stock_threshold': { $exists: false } },
        { 'alert_settings.critical_stock_threshold': { $exists: false } },
        { 'alert_settings.expiration_warning_days': { $exists: false } },
        { 'alert_settings.critical_expiration_days': { $exists: false } },
      ],
    });

    let modified = 0;
    for (const product of products) {
      product.alert_settings = {
        low_stock_threshold: Number(product.alert_settings?.low_stock_threshold ?? product.low_stock_threshold ?? product.min_quantity ?? 0),
        critical_stock_threshold: Number(product.alert_settings?.critical_stock_threshold ?? product.critical_stock_threshold ?? 0),
        expiration_warning_days: Number(product.alert_settings?.expiration_warning_days ?? 30),
        critical_expiration_days: Number(product.alert_settings?.critical_expiration_days ?? 7),
      };
      await product.save();
      modified += 1;
    }

    console.log(`Product alert settings migration complete. Modified ${modified} products.`);
  } catch (error) {
    console.error('Product alert settings migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();

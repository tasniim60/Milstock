const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');

const run = async () => {
  await connectDB();

  const adminResult = await User.updateMany(
    { role: 'admin', assigned_warehouse: { $exists: false } },
    { $set: { assigned_warehouse: null, assigned_warehouse_name: '' } }
  );

  const unitResult = await User.updateMany(
    { role: 'unit', assigned_warehouse: { $exists: false } },
    { $set: { assigned_warehouse: null, assigned_warehouse_name: '' } }
  );

  console.log(`Admin users updated: ${adminResult.modifiedCount || 0}`);
  console.log(`Unit users updated with null assignment: ${unitResult.modifiedCount || 0}`);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

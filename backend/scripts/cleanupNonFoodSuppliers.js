const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Supplier = require('../models/supplierModel');

const nonFoodPattern = /(medical|equipment|hardware|device)/i;

const run = async () => {
  await connectDB();

  const userResult = await User.updateMany(
    {
      role: 'supplier',
      $or: [
        { name: nonFoodPattern },
        { email: nonFoodPattern },
      ],
    },
    { $set: { status: 'inactive' } }
  );

  const supplierResult = await Supplier.updateMany(
    {
      $or: [
        { name: nonFoodPattern },
        { email: nonFoodPattern },
        { category: nonFoodPattern },
      ],
    },
    { $set: { status: 'inactive' } }
  );

  console.log('Non-food supplier cleanup complete.');
  console.log(`Supplier users inactivated: ${userResult.modifiedCount || 0}`);
  console.log(`Supplier records inactivated: ${supplierResult.modifiedCount || 0}`);
};

run()
  .catch((error) => {
    console.error('Non-food supplier cleanup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

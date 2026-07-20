const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/userModel');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const run = async () => {
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected for user status migration');

  const result = await User.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active' } }
  );

  console.log(`Matched ${result.matchedCount} users`);
  console.log(`Modified ${result.modifiedCount} users`);
};

run()
  .catch((error) => {
    console.error('User status migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  });

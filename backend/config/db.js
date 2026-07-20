const mongoose = require('mongoose');

const dbState = {
  connected: false,
  lastError: '',
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.connection.on('connected', () => {
    dbState.connected = true;
    dbState.lastError = '';
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    dbState.connected = false;
    dbState.lastError = error.message;
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    dbState.connected = false;
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 8000),
  });
};

const getDbState = () => ({
  connected: dbState.connected || mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  lastError: dbState.lastError,
});

module.exports = connectDB;
module.exports.getDbState = getDbState;

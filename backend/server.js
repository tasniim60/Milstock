const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/db');
const { generateExpirationNotifications } = require('./services/expirationNotificationService');

const PORT = process.env.PORT || 5001;

const start = async () => {
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
    generateExpirationNotifications().catch((error) => {
      console.error('Failed to generate startup expiration notifications:', error.message);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Starting API server without database connection so health checks and clear API errors still work.');
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}${dbConnected ? '' : ' (database disconnected)'}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();

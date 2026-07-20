const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const warehouseRoutes = require('./routes/warehouseRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/orderItemRoutes');
const productWarehouseRoutes = require('./routes/productWarehouseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const consumptionRoutes = require('./routes/consumptionRoutes');
const wasteRoutes = require('./routes/wasteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const providerRoutes = require('./routes/providerRoutes');
const supplierOrderRoutes = require('./routes/supplierOrderRoutes');
const { getDbState } = require('./config/db');
const { setupSwagger } = require('./docs/swagger');

const app = express();
const defaultClientOrigins = [
  'http://localhost:5173',
  'https://milstock-frontend.vercel.app',
];
const configuredClientOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
]
  .filter(Boolean)
  .flatMap((origins) => origins.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedClientOrigins = [...new Set([...defaultClientOrigins, ...configuredClientOrigins])];

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(`CORS origin ${origin} is not allowed`, 403));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  const database = getDbState();
  res.status(database.connected ? 200 : 503).json({
    success: database.connected,
    message: database.connected ? 'MilStock API running' : 'MilStock API running, but database is not connected',
    database,
  });
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'MilStock API',
    message: 'Food warehouse inventory backend is running',
    health: '/api/health',
  });
});

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/supplier', supplierOrderRoutes);
app.use('/api/orders/items', orderItemRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/inventory/product-warehouses', productWarehouseRoutes);
app.use('/api/product-warehouses', productWarehouseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', inventoryRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/consumptions', consumptionRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/wastes', wasteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} was not found`, 404));
});

app.use(errorHandler);

module.exports = app;

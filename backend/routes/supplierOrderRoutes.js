const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSupplierOrders,
  getSupplierOrder,
  updateSupplierOrderStatus,
} = require('../controllers/orderController');

const router = express.Router();

router.use(authenticate);
router.use(authorize('supplier'));

router.get('/orders', getSupplierOrders);
router.get('/orders/:id', getSupplierOrder);
router.patch('/orders/:id/status', updateSupplierOrderStatus);

module.exports = router;

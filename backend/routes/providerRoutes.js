const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getSupplierUsers } = require('../controllers/userController');
const {
  getSupplierOrders,
  getSupplierOrder,
  updateSupplierOrderStatus,
} = require('../controllers/orderController');

const router = express.Router();

router.use(authenticate);

router.get('/', getSupplierUsers);
router.get('/orders', authorize('supplier'), getSupplierOrders);
router.get('/orders/:id', authorize('supplier'), getSupplierOrder);
router.patch('/orders/:id/status', authorize('supplier'), updateSupplierOrderStatus);

module.exports = router;

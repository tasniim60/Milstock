const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  orderRules,
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  adminDecision,
  getOrderStatusLogs,
  deleteOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(authenticate);

router.route('/').get(getOrders).post(orderRules, validate, createOrder);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);
router.patch('/:id/admin-decision', authorize('admin'), adminDecision);
router.get('/:id/status-logs', getOrderStatusLogs);
router
  .route('/:id')
  .get(getOrder)
  .put(authorize('admin'), orderRules, validate, updateOrder)
  .delete(authorize('admin'), deleteOrder);

module.exports = router;

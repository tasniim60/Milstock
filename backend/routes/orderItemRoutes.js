const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  orderItemRules,
  getOrderItems,
  getOrderItem,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
} = require('../controllers/orderItemController');

const router = express.Router();

router.use(authenticate);

router.route('/').get(getOrderItems).post(orderItemRules, validate, createOrderItem);
router
  .route('/:id')
  .get(getOrderItem)
  .put(authorize('admin'), orderItemRules, validate, updateOrderItem)
  .delete(authorize('admin'), deleteOrderItem);

module.exports = router;

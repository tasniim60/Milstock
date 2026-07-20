const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  inventoryMovementRules,
  getInventoryMovements,
  getInventoryMovement,
  createInventoryMovement,
  updateInventoryMovement,
  completeTransfer,
  deleteInventoryMovement,
} = require('../controllers/inventoryMovementController');

const router = express.Router();

router.use(authenticate);

router.patch('/complete-transfer/:orderId', authorize('admin'), completeTransfer);
router
  .route('/')
  .get(getInventoryMovements)
  .post(authorize('admin'), inventoryMovementRules, validate, createInventoryMovement);
router
  .route('/:id')
  .get(getInventoryMovement)
  .put(authorize('admin'), inventoryMovementRules, validate, updateInventoryMovement)
  .delete(authorize('admin'), deleteInventoryMovement);

module.exports = router;

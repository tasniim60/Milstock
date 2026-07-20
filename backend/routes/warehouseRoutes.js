const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  warehouseRules,
  getWarehouses,
  getWarehouseDashboard,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouseController');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(getWarehouses)
  .post(authorize('admin'), warehouseRules, validate, createWarehouse);
router.get('/:id/dashboard', getWarehouseDashboard);
router
  .route('/:id')
  .get(getWarehouse)
  .put(authorize('admin'), warehouseRules, validate, updateWarehouse)
  .delete(authorize('admin'), deleteWarehouse);

module.exports = router;

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  productWarehouseRules,
  getProductWarehouses,
  getProductWarehouse,
  createProductWarehouse,
  updateProductWarehouse,
  deleteProductWarehouse,
} = require('../controllers/productWarehouseController');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(getProductWarehouses)
  .post(authorize('admin'), productWarehouseRules, validate, createProductWarehouse);
router
  .route('/:id')
  .get(getProductWarehouse)
  .put(authorize('admin'), productWarehouseRules, validate, updateProductWarehouse)
  .delete(authorize('admin'), deleteProductWarehouse);

module.exports = router;

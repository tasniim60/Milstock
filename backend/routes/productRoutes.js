const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  productRules,
  alertSettingsRules,
  normalizeProductRequest,
  getProducts,
  getProduct,
  getProductAlertSettings,
  updateProductAlertSettings,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.use(authenticate);

router.route('/').get(getProducts).post(authorize('admin'), normalizeProductRequest, productRules, validate, createProduct);
router
  .route('/:id/alert-settings')
  .get(getProductAlertSettings)
  .patch(authorize('admin'), alertSettingsRules, validate, updateProductAlertSettings);
router
  .route('/:id')
  .get(getProduct)
  .put(authorize('admin'), normalizeProductRequest, productRules, validate, updateProduct)
  .delete(authorize('admin'), deleteProduct);

module.exports = router;

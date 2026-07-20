const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createWasteRules,
  createWaste,
  getWaste,
  getWasteProducts,
  getWasteAnalytics,
} = require('../controllers/wasteController');

const router = express.Router();

router.use(authenticate);

router.get('/products', getWasteProducts);
router.get('/analytics', getWasteAnalytics);
router.get('/', getWaste);
router.post('/', createWasteRules, validate, createWaste);

module.exports = router;

const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  consumptionRules,
  cancelRules,
  updateRules,
  getConsumptions,
  getMyConsumptions,
  getConsumption,
  createConsumption,
  cancelConsumption,
  updateConsumption,
  deleteConsumption,
} = require('../controllers/consumptionController');

const router = express.Router();

router.use(authenticate);

router.route('/').get(getConsumptions).post(consumptionRules, validate, createConsumption);
router.get('/my', getMyConsumptions);
router.patch('/:id/cancel', cancelRules, validate, cancelConsumption);
router
  .route('/:id')
  .get(getConsumption)
  .put(updateRules, validate, updateConsumption)
  .patch(updateRules, validate, updateConsumption)
  .delete(deleteConsumption);

module.exports = router;

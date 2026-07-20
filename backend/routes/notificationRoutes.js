const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  notificationRules,
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  getExpirationNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticate);

router.get('/expiration/check', getExpirationNotifications);
router.get('/expiration', getExpirationNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.route('/').get(getNotifications).post(notificationRules, validate, createNotification);
router.patch('/:id/read', markNotificationRead);
router
  .route('/:id')
  .get(getNotification)
  .put(notificationRules, validate, updateNotification)
  .delete(deleteNotification);

module.exports = router;

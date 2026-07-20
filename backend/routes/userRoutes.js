const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  userRules,
  createUserRules,
  statusRules,
  passwordRules,
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res, next) => {
  if (req.query.role === 'supplier') {
    req.query.status = req.query.status || 'active';
    return getUsers(req, res, next);
  }
  return authorize('admin')(req, res, (error) => {
    if (error) return next(error);
    return getUsers(req, res, next);
  });
});

router.use(authorize('admin'));

router.route('/').post(createUserRules, validate, createUser);
router.patch('/:id/status', statusRules, validate, updateUserStatus);
router.patch('/:id/password', passwordRules, validate, resetUserPassword);
router.route('/:id').get(getUser).put(userRules, validate, updateUser).patch(userRules, validate, updateUser).delete(deleteUser);

module.exports = router;

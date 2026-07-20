const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return next(new AppError(result.array().map((error) => error.msg).join(', '), 400));
  }

  next();
};

module.exports = validate;

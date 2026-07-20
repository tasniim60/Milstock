const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map((entry) => entry.message),
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value violates a unique field',
      fields: Object.keys(error.keyValue || {}),
    });
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
  });
};

module.exports = errorHandler;

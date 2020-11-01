const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const message = `This name is already exists: ${err.keyValue.name}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid JSON token, Please login again.', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('Your token has expired, please login again.', 401);
};

// while we are in development mode
const sendErrorDev = (err, req, res) => {
  // For API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      err: err,
      errorName: err.name,
      message: err.message,
      stack: err.stack
    });
  }
  // For rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

// While we are in production mode
const sendErrorProd = (err, req, res) => {
  // For API
  // A) Operational: trusted error: send error message to the client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming: all other error: Don't send error: send generic message
    return res.status(500).json({
      status: 'fail',
      message: 'Something went very wrong!!'
    });
  }
  // For rendered website
  // A) Operational: trusted error: send error message to the client

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  }
  // B) Programming: all other error: Don't send error: send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

// Global error handler middleware (Globally called in app.js)
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';
  const { message } = err;

  // Will check it by using template string to compare the value of NODE_ENV(Not yet used)

  // Checking if we are in dev or production mode
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = message;

    // Different types of errors picked up from mongoDB and handled them separately
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }
};

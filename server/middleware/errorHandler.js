export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const rawExplicitStatus = Number(err.statusCode || err.status);
  const explicitStatus = rawExplicitStatus >= 400 && rawExplicitStatus < 600 ? rawExplicitStatus : 0;
  let statusCode = explicitStatus || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found with the specified ID';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer & File upload errors
  if (err.name === 'MulterError' || err.message?.includes('Invalid file type')) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = err.message && err.message !== 'File too large'
        ? err.message
        : 'File size cannot exceed 5MB';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');

const tourRouter = require('./routes/tour.routes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Routes
app.use('/api/v1/tours', tourRouter);

app.all('*', (req, res, next) => {
  // If next receives an argument, express will interpret it as
  // an error.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler middleware: express only call this when an error is detected.
app.use((err, req, res, next) => {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;

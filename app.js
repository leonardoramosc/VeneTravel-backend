const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error.controller');

const tourRouter = require('./routes/tour.routes');
const userRouter = require('./routes/user.routes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // If next receives an argument, express will interpret it as
  // an error.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler middleware: express only call this when an error is detected.
app.use(globalErrorHandler);

module.exports = app;

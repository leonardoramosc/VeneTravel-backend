const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error.controller');

const tourRouter = require('./routes/tour.routes');
const userRouter = require('./routes/user.routes');

const app = express();

// Middlewares
// Set security HTTP headers
app.use(helmet());

// Development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Allow 100 request per hour per ip address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter); // add limiter middleware to all routes that start with /api

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb', // Limit body size to 10kb
  })
);

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

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

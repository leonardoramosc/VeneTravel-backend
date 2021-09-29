const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error.controller');

const tourRouter = require('./routes/tour.routes');
const userRouter = require('./routes/user.routes');
const reviewRouter = require('./routes/review.routes');
const viewRouter = require('./routes/view.routes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

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
app.use(cookieParser());

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution (remove duplicate queryparams)
// with the whitelist option we can specify a list of parameters that
// are allowed to be repeated.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // If next receives an argument, express will interpret it as
  // an error.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handler middleware: express only call this when an error is detected.
app.use(globalErrorHandler);

module.exports = app;

const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tour.routes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Routes
app.use('/api/v1/tours', tourRouter);

module.exports = app;

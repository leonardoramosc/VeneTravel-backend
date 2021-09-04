/* eslint-disable new-cap */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION. Shutting down...');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const { DB_LOCAL_URI } = process.env;

mongoose
  .connect(DB_LOCAL_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

const app = require('./app');

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION. Shutting down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/tour.model');
const User = require('./models/user.model');
const Review = require('./models/review.model');

dotenv.config({ path: './config.env' });

const DB = process.env.DB_URI;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev_data/data/tours.json`, 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/dev_data/data/users.json`, 'utf-8')
);

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/dev_data/data/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

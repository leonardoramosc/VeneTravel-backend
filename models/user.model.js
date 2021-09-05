const mongoose = require('mongoose');
const validator = require('validator');

// name, email, photo, password, passwordConfirm.
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name.'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE}: is not a valid email',
    },
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must have a password.'],
    minlength: [8, 'Password must have at least 8 characters'],
    maxlength: [16, 'Password must have less than 17 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirm is missing.'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Confirmation password does not match with password',
    },
  },
});

userSchema.pre(/^find/, function (next) {
  this.find().select('-password -passwordConfirm');
  next();
});

userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $project: { password: 0, passwordConfirm: 0 },
  });

  next();
});

// eslint-disable-next-line new-cap
const User = new mongoose.model('User', userSchema);

module.exports = User;

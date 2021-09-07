const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    select: false,
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = async function (
  incomingPassword,
  userPassword
) {
  return await bcrypt.compare(incomingPassword, userPassword);
};

// eslint-disable-next-line new-cap
const User = new mongoose.model('User', userSchema);

module.exports = User;

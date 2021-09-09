const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const decodeToken = (token) =>
  promisify(jwt.verify)(token, process.env.JWT_SECRET);

exports.signup = catchAsync(async (req, res, next) => {
  const { body } = req;

  const newUser = await User.create({
    name: body.name,
    email: body.email,
    role: body.role,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password exist
  if (!email || !password) {
    return next(new AppError('Invalid email or password.', 400));
  }

  // check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 400));
  }

  const isValidPassword = await user.correctPassword(password, user.password);
  if (!isValidPassword) {
    return next(new AppError('Invalid email or password', 400));
  }

  const token = signToken(user._id);

  // send jwt
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  let token;
  // Check if token exists
  if (authorization && authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, please log in to get access', 401)
    );
  }

  // Check if token is valid
  const decoded = await decodeToken(token);

  // Check if user exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // Check if user changed password after the token was issued. jwt iat means "issued at"
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed the password', 401));
  }

  req.user = user;
  next();
});

exports.restrictTo = function (...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not allowed', 401));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`Invalid email.`, 404));
  }

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // Since createPasswordResetToken() add the properties <passwordResetToken> and <passwordResetExpires>
  // we need to save this change in the database, but also we need to disable the validators in order
  // to avoid errors for example with required fields.
  await user.save({ validateBeforeSave: false });
  // send it to user's email

  res.status(200).json({
    status: 'success',
    resetToken,
  });
});

exports.resetPassword = (req, res, next) => {};

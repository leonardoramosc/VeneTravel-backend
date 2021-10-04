const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const decodeToken = (token) =>
  promisify(jwt.verify)(token, process.env.JWT_SECRET);

function createSendToken(user, statusCode, res) {
  const token = signToken(user._id);

  const cookieOpts = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production', // Just send in https if production
    httpOnly: true, // Cannot be accesed or modified in any way by browser (prevent CSS attack)
  };

  res.cookie('jwt', token, cookieOpts);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const { body } = req;

  const newUser = await User.create({
    name: body.name,
    email: body.email,
    role: body.role,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  let token;
  // Check if token exists
  if (authorization && authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  res.locals.user = user;
  next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // verify token
      const decoded = await decodeToken(req.cookies.jwt);
      // Check if user exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next();
      }

      // Check if user changed password after the token was issued. jwt iat means "issued at"
      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = user;

      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

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

  try {
    // send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired, and user, set new password
  if (!user) {
    return next(new AppError('Invalid token or expired.', 401));
  }

  // update changedPasswordAt property
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in, sent jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(req.user);
  // 1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('Invalid User', 400));
  }

  // 2) Check if posted current password is correct
  const isCorrectPass = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );

  if (!isCorrectPass) {
    return next(new AppError('Incorrect password', 401));
  }

  // 3) if password is correct, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4) Log user in, send JWT.
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

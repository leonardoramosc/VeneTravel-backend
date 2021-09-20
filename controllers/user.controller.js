const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getOneUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateOneUser = factory.updateOne(User);
exports.delete = factory.deleteOne(User);

function filterObj(obj, ...fields) {
  const newObj = {};

  fields.forEach((field) => {
    if (obj[field]) {
      newObj[field] = obj[field];
    }
  });

  return newObj;
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Error if users Posts password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // 2) Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${Model.modelName} was found`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = function (Model) {
  const modelName = Model.modelName.toLowerCase();

  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No ${modelName} was found`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        [modelName]: doc,
      },
    });
  });
};

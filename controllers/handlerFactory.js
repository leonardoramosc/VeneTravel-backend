const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        [Model.modelName]: newDoc,
      },
    });
  });
};

exports.getOne = function (Model, populateOpts) {
  const modelName = Model.modelName.toLowerCase();

  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOpts) {
      query = query.populate(populateOpts);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No ${modelName} was found`, 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        [modelName]: doc,
      },
    });
  });
};

exports.getAll = function (Model) {
  const modelName = `${Model.modelName.toLowerCase()}s`;

  return catchAsync(async (req, res, next) => {
    // req.filter it can be added in a middleware for a specific router
    const filter = req.filter || {};
    const features = new APIFeatures(Model.find(filter), req.query);
    const docs = await features.filter().sort().fields().runQuery();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        [modelName]: docs,
      },
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

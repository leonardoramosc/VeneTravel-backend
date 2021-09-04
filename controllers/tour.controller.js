const Tour = require('../models/tour.model');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query);
  const tours = await features.filter().sort().fields().runQuery();

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.aliasTopTours = (req, res, next) => {
  //limit=5&sort=-ratingsAverage,price
  req.query = {
    limit: '5',
    sort: '-ratingsAverage,price',
    ...req.query,
  };

  next();
};

exports.getOneTour = catchAsync(async (req, res, next) => {
  const tourID = req.params.id;
  const tour = await Tour.findById(tourID);

  if (!tour) {
    return next(new AppError('No tour found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.updateOneTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndRemove(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // El campo por el cual queremos agrupar
        num: { $sum: 1 }, // Cantidad de documentos
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // Ordenar por avgPrice de forma ascendente
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, // Seleccionar todos menos los que tengan _id = EASY
    // },
  ]);

  res.json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Por cada fecha del array startDates, se crea un documento de tour.
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Agrupar por mes
        numTours: { $sum: 1 }, // cantidad de tours por mes
        tours: { $push: '$name' }, // crear un array con los nombres de los tours de cada mes
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 }, // No mostrar el campo _id
    },
    {
      $sort: { numTours: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

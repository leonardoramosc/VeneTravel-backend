const Tour = require('../models/tour.model');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.createTour = factory.createOne(Tour);
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });
exports.getAllTours = factory.getAll(Tour);
exports.updateOneTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  //limit=5&sort=-ratingsAverage,price
  req.query = {
    limit: '5',
    sort: '-ratingsAverage,price',
    ...req.query,
  };

  next();
};

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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlng/unit/:unit
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const earthRadiusMiles = 3963.2;
  const earthRadiusKms = 6378.1;

  const radius =
    unit === 'miles' ? distance / earthRadiusMiles : distance / earthRadiusKms;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format: lat,lng',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

// get distances between given coordinates and all tours.
exports.getDistances = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlng/unit/:unit
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const milesPerMeter = 0.000621371;
  const kilometersPerMeter = 0.001;

  const multiplier = unit === 'miles' ? milesPerMeter : kilometersPerMeter;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format: lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        // since the distance is in meters we need to convert it by the unit (kilometers or miles)
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

const Review = require('../models/review.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.createReview = catchAsync(async (req, res, next) => {
  // the user ID for the review must be the ID of the logged user.
  req.body.user = req.user._id;
  req.body.tour = req.params.tourId;

  const review = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getOneReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ tour: req.params.tourId });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review was found', 400));
  }

  // if the logged in user did not write the review, send error.
  if (review.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not allowed to modify this review', 401));
  }

  const { user: _user, ...reviewParams } = req.body;
  reviewParams.user = req.user._id;

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    reviewParams,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview,
    },
  });
});
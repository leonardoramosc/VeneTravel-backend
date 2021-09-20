const Review = require('../models/review.model');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.createReview = factory.createOne(Review);
exports.getOneReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

/**
 * Modify the body of the request to assign the following properties:
 * user: the logged user
 * tour: the tour id of specified in the query param
 * In this way, the user have to specify in the body only the review field.
 */
exports.setBodyOnCreate = (req, res, next) => {
  // the user ID for the review must be the ID of the logged user.
  req.body.user = req.user._id;
  req.body.tour = req.params.tourId;

  next();
};

exports.validateOnUpdate = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new AppError('No review was found', 400));
    }

    // if the logged in user did not write the review, send error.
    if (review.user._id.toString() !== req.user._id.toString()) {
      return next(
        new AppError('You are not allowed to modify this review', 401)
      );
    }

    req.body.user = req.user._id;

    next();
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

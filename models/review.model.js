/* eslint-disable new-cap */
const mongoose = require('mongoose');
const Tour = require('./tour.model');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review field is required.'],
      minlength: [8, 'Review must have at least 8 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have rating'],
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot be greater than 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
  },
  {
    toJSON: { virtuals: true }, // cuando la data se enviada como JSON, incluir los campos virtuales
    toObject: { virtuals: true }, // cuando la data se enviada como objeto, incluir los campos virtuales
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Add a method to the Model to calc AverareRatings and persist it in the tour.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 'This' keyword points to the Model (not the document)
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

// After save a review, update the ratingsAverage of the tour.
// post middlewares doesn't receive 'next' callback.
reviewSchema.post('save', function () {
  // 'this' keyword is the current document, we use constructor becase calcAverareRatings was declared in the model.
  // the model is the constructor of the document.
  this.constructor.calcAverageRatings(this.tour);
});

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;

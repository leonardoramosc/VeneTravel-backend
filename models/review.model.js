/* eslint-disable new-cap */
const mongoose = require('mongoose');

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
  this.populate({
    path: 'user',
    select: 'name photo',
  }).populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;

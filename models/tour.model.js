/* eslint-disable new-cap */
const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: true,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true }, // cuando la data se enviada como JSON, incluir los campos virtuales
    toObject: { virtuals: true }, // cuando la data se enviada como objeto, incluir los campos virtuales
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before save() and create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE: para todos los metodos que empiecen con find (find, findOne, etc).
// antes de ejecutar la query, solo buscar los que NO sean secretos.
tourSchema.pre(/^find/, function (next) {
  // Seleccionar solo los tours que NO sean secretos.
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

  next();
});

// QUERY MIDDLEWARE: despues de haber terminado la query, obtener el tiempo que tomo hacerla.
// tourSchema.post(/^find/, function (docs, next) {
//   const time = Date.now() - this.start;
//   console.log(`Query took ${time} milliseconds to finish`);
//   console.log(docs);

//   next();
// });

// AGGREGATION MIDDLEWARE:
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  console.log(this.pipeline());
  next();
});

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;

const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const authController = require('../controllers/auth.controller');

const router = Router({ mergeParams: true });

router.use('/', authController.protect);

router.use('/', (req, res, next) => {
  if (req.params.tourId) {
    // This filter will be used by the handlerFactory get all method
    req.filter = { tour: req.params.tourId };
  }

  next();
});

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setBodyOnCreate,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getOneReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.validateOnUpdate,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;

const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const authController = require('../controllers/auth.controller');

const router = Router();

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

router
  .route('/:id')
  .get(authController.protect, reviewController.getOneReview)
  .patch(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.updateReview
  )
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;

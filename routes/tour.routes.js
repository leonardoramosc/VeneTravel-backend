const { Router } = require('express');
const tourController = require('../controllers/tour.controller');

const router = Router();

// midleware de param: se ejecuta solo en rutas que tengan el param "id" en este caso.
// router.param('id', (req, res, next, val) => {
//     console.log(`tour id: ${val}`);
//     next();
// });

router
  .route('/top-5-cheapest')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.updateOneTour)
  .delete(tourController.deleteTour);

module.exports = router;

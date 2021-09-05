const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/signup', authController.signup);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateOneUser)
  .delete(userController.deleteUser);

module.exports = router;

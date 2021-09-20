const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getOneUser
);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.patch(
  '/updatePassword/:id',
  authController.protect,
  authController.updatePassword
);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateOneUser)
  .delete(userController.delete);

module.exports = router;

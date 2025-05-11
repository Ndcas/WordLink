const express = require('express');
const controller = require('../controllers/account');

const router = express.Router();

// Cần tham số email trong body
router.post('/getOTP', controller.getOTP);

// Cần refresh token trong header Authorization: 'Bearer [refresh token]' => token
router.post('/refreshAccessToken', controller.refreshAccessToken);

// Cần tham số username, password, email, otp
router.post('/signUp', controller.signUp);

// Cần tham số username, password => token và refresh token
router.post('/logIn', controller.logIn);

// Cần refresh token trong header Authorization: 'Bearer [refresh token]'
router.post('/quickLogIn', controller.quickLogIn);

// Cần tham số username, password => token và refresh token
// router.post('/logInAdmin', controller.logInAdmin);

// Cần token trong header Authorization: 'Bearer [token]' và aid trong body
// router.post('/suspend', controller.verifyAccessToken, controller.suspend);

module.exports = router;
const express = require('express');
const controller = require('../controllers/account');

const router = express.Router();

// Cần tham số email (Email) trong body
// => Gửi OTP đến email
router.post('/getOTPSignUp', controller.getOTPSignUp);

// Cần refresh token trong header Authorization: 'Bearer [refresh token]'
// => accessToken
router.post('/refreshAccessToken', controller.refreshAccessToken);

// Cần tham số username (Username), password (APassword chưa hash), email (Email), otp trong body
router.post('/signUp', controller.signUp);

// Cần tham số email (Email), password (APassword chưa hash) trong body
// => accessToken và refreshToken
router.post('/logIn', controller.logIn);

// Cần refresh token trong header Authorization: 'Bearer [refresh token]'
// => accessToken và refreshToken
router.post('/quickLogIn', controller.quickLogIn);

// Cần access token trong header Authorization: 'Bearer [access token]'
// => Username, Email, AvatarImage (AvatarImage.Name), Score
router.get('/getAccountInfo', controller.verifyAccessToken, controller.getAccountInfo);

// => [{Rank, Username, Score}...]
router.get('/getLeaderboard', controller.getLeaderboard);

// Cần access token trong header Authorization: 'Bearer [access token]'
// => rank
router.get('/getAccountRank', controller.verifyAccessToken, controller.getAccountRank);

// Cần access token trong header Authorization: 'Bearer [access token]', oldPassword (APassword chưa hash cũ), newPassword (APassword chưa hash mới) trong body
router.post('/changePassword', controller.verifyAccessToken, controller.changePassword);

// Cần email (Email) trong body
// => Gửi OTP đến email của tài khoản
router.post('/getOTPResetPassword', controller.getOTPResetPassword);

// Cần email (Email), newPassword (APassword chưa hash mới), otp trong body
router.post('/resetPassword', controller.resetPassword);

// Cần access token trong header Authorization: 'Bearer [access token]', aiid (AIID) trong body
router.post('/changeAvatarImage', controller.verifyAccessToken, controller.changeAvatarImage);

// Cần access token trong header Authorization: 'Bearer [access token]', username (Username), aiid (AIID) trong body (có thể không truyền 1 trong 2 nếu không cần đổi)
router.post('/changeUsernameAndAvatarImage', controller.verifyAccessToken, controller.changeUsernameAndAvatarImage);

// Cần access token trong header Authorization: 'Bearer [access token]'
// => numOfMatchesPlayed (số game đã chơi), pvpWin (số game PVP thắng), pvpLose (số game PVP thua), numOfWordsUsed (số từ đã dùng), avgPopularity (độ phổ biến trung bình 100 từ cuối được dùng), last100countMap (object {word: count} chứa 100 từ cuối cùng và số lần sử dụng)
router.get('/getAnalyticReport', controller.verifyAccessToken, controller.getAnalyticReport);

// Cần access token trong header Authorization: 'Bearer [access token]'
router.post('/logOut', controller.verifyAccessToken, controller.logOut);

module.exports = router;
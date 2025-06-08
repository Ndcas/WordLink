const express = require('express');
const controller = require('../controllers/avatarimage');
const { verifyAccessToken } = require('../controllers/account');

const router = express.Router();

// Cần refresh token trong header Authorization: 'Bearer [refresh token]'
// => [AvatarImage]
router.get('/getAvatarImageList', verifyAccessToken, controller.getAvatarImageList);

module.exports = router;
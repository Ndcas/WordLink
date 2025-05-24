const express = require('express');
const controller = require('../controllers/bookmark');
const { verifyAccessToken } = require('../controllers/account');

const router = express.Router();

// Cần access token trong header Authorization: 'Bearer [access token]'
// => [{WordV}...]
router.get('/getBookmarks', verifyAccessToken, controller.getBookmarks);

// Cần access token trong header Authorization: 'Bearer [access token]', word (WordV) trong body
router.post('/newBookmark', verifyAccessToken, controller.newBookmark);

// Cần access token trong header Authorization: 'Bearer [access token]', word (WordV) trong body
router.post('/deleteBookmark', verifyAccessToken, controller.deleteBookmark);

module.exports = router;
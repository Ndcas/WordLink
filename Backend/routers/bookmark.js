const express = require('express');
const controller = require('../controllers/bookmark');
const { verifyAccessToken } = require('../controllers/account');

const router = express.Router();

router.get('/getBookmarks', verifyAccessToken, controller.getBookmarks);

module.exports = router;
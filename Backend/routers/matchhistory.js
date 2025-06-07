const express = require('express');
const controller = require('../controllers/matchhistory');
const { verifyAccessToken } = require('../controllers/account');

const router = express.Router();

// Cần access token trong header Authorization: 'Bearer [access token]'
// => pve (30 MatchHistory với bot gần nhất, không có AID1, AID2), pvp (30 MatchHistory với người gần nhất, không có AID1, AID2, kèm Username và tên AvatarImage của player 2)
router.get('/getMatchHistory', verifyAccessToken, controller.getMatchHistory);

module.exports = router;
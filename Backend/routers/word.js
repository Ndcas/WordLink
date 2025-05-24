const express = require('express');
const controller = require('../controllers/word');

const router = express.Router();

// Cần tham số qWord ở params
// => [{WordV}...]
router.get('/getWordSuggestions', controller.getWordSuggestions);

module.exports = router;
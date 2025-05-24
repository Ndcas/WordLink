const express = require('express');
const controller = require('../controllers/word');

const router = express.Router();

// Cần tham số qWord ở query
// => [{WordV}...]
router.get('/getWordSuggestions', controller.getWordSuggestions);

// Cần tham số word ở query
// => popularity
router.post('/getWordPopularity', controller.getWordPopularity);

module.exports = router;
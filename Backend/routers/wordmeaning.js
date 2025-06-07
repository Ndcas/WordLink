const express = require('express');
const controller = require('../controllers/wordmeaning');

const router = express.Router();

// Cần tham số word (WordV), ipa (Phonetic) ở query
// => word, ipa, pronunciation
router.get('/getPronunciation', controller.getPronunciation);

// Cần tham số qWord ở query
// => word, ipa, explanation
router.get('/explainPronunciation', controller.explainPronunciation);

module.exports = router;
const express = require('express');
const controller = require('../controllers/wordmeaning');

const router = express.Router();

// Cần tham số word (WordV), ipa (Phonetic) ở body
// => word, ipa, pronunciation
router.post('/getPronunciation', controller.getPronunciation);

// Cần tham số qWord ở query
// => word, ipa, explanation
router.post('/explainPronunciation', controller.explainPronunciation);

module.exports = router;
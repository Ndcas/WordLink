const express = require('express');
const controller = require('../controllers/word');

const router = express.Router();

// Cần tham số qWord ở query
// => [{WordV}...]
router.get('/getWordSuggestions', controller.getWordSuggestions);

// Cần tham số word (WordV) ở query
// => word (WordV), popularity (Popularity), meanings ([WordMeaning (không có WMID, WordV, POSID) kèm PartOfSpeech.POSName])
router.get('/getWordInformation', controller.getWordInformation);

module.exports = router;
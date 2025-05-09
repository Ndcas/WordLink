const express = require('express');
const controller = require('../controllers/test');

const router = express.Router();

router.get('/', controller.toTestPage);

module.exports = router;
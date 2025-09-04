const express = require('express');
const controller = require('../controllers/admin');

const router = express.Router();

router.get('/', controller.toIndex);

router.post('/dangNhap', controller.dangNhap);

router.get('/dangXuat', controller.dangXuat);

router.get('/toReport', controller.verify, controller.toReport);

module.exports = router;
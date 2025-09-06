const express = require('express');
const controller = require('../controllers/admin');

const router = express.Router();

router.get('/', controller.toIndex);

router.post('/dangNhap', controller.dangNhap);

router.get('/dangXuat', controller.dangXuat);

router.get('/toReport', controller.verify, controller.toReport);

router.get('/toAccount', controller.verify, controller.toAccount);

router.post('/lockAccount', controller.verify, controller.lockAccount);

router.post('/unlockAccount', controller.verify, controller.unlockAccount);

router.get('/toAccountDetails', controller.verify, controller.toAccountDetails);

router.post('/editAccount', controller.verify, controller.editAccount);

router.get('/toWord', controller.verify, controller.toWord);

router.get('/toWordDetails', controller.verify, controller.toWordDetails);

router.get('/toChangePass', controller.verify, controller.toChangePass);

module.exports = router;
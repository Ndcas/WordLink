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

router.get('/toAddWord', controller.verify, controller.toAddWord);

router.post('/addWord', controller.verify, controller.addWord);

router.post('/deleteWord', controller.verify, controller.deleteWord);

router.post('/editWord', controller.verify, controller.editWord);

router.post('/addMeaning', controller.verify, controller.addMeaning);

router.post('/deleteMeaning', controller.verify, controller.deleteMeaning);

router.get('/toEditMeaning', controller.verify, controller.toEditMeaning);

router.post('/editMeaning', controller.verify, controller.editMeaning);

router.get('/toWordDetails', controller.verify, controller.toWordDetails);

router.get('/toChangePass', controller.verify, controller.toChangePass);

router.post('/changePass', controller.verify, controller.changePass);

router.get('/toResetPass', controller.toResetPass);

router.post('/sendOTP', controller.sendOTP);

router.post('/resetPass', controller.resetPass);

module.exports = router;
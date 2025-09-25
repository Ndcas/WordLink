const Account = require('../models/account');
const Admin = require('../models/admin');
const AvatarImage = require('../models/avatarimage');
const Bookmark = require('../models/bookmark');
const MatchHistory = require('../models/matchhistory');
const Word = require('../models/word');
const WordHistory = require('../models/wordhistory');
const WordMeaning = require('../models/wordmeaning');
const PartOfSpeech = require('../models/partofspeech');
const authentication = require('../services/authentication');
const cache = require('../services/cache');
const sendEmail = require('../services/mail');
const { Op } = require('sequelize');
const db = require('../services/database');

function toIndex(req, res) {
    let status = parseInt(req.query.status, 10) ?? 0;
    let message = '';
    switch (status) {
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Email hoặc mật khẩu không đúng';
            break;
    }
    res.render('index', {
        status: status,
        message: message
    });
}

function verify(req, res, next) {
    let refresh = req.signedCookies.refreshToken;
    if (!refresh) {
        return res.redirect('/admin');
    }
    let payload = authentication.verifyRefreshToken(refresh);
    if (!payload || refresh != cache.get(`Admin:${payload.email}`)) {
        return res.redirect('/admin');
    }
    req.authorization = {
        email: payload.email
    }
    next();
}

async function dangNhap(req, res) {
    let email = req.body.email?.trim();
    let password = req.body.password?.trim();
    if (!email || !password) {
        return res.redirect('/admin?status=-1');
    }
    password = authentication.hash(password);
    let admin = await Admin.findOne({
        where: {
            Email: email,
            APassword: password
        }
    });
    if (!admin) {
        return res.redirect('/admin?status=-2');
    }
    let refresh = authentication.signRefreshToken({
        email: email
    });
    cache.set(`Admin:${email}`, refresh);
    res.cookie('refreshToken', refresh, {
        httpOnly: true,
        signed: true
    });
    return res.redirect('/admin/toReport');
}

function dangXuat(req, res) {
    let refresh = req.signedCookies.refreshToken;
    if (!refresh) {
        return res.redirect('/admin');
    }
    let payload = authentication.verifyRefreshToken(refresh);
    if (!payload) {
        return res.redirect('/admin');
    }
    cache.del(`Admin:${payload.email}`);
    return res.redirect('/admin');
}

async function toReport(req, res) {
    res.render('report', {
        title: 'Thống kê',
        current: 'report'
    });
}

async function toAccount(req, res) {
    let accounts = await Account.findAll();
    return res.render('account', {
        title: 'Quản lý tài khoản',
        current: 'account',
        accounts: accounts
    });
}

async function lockAccount(req, res) {
    let AID = req.body.id;
    if (!AID) {
        return res.status(400).json({ message: 'Thiếu AID' });
    }
    let account = await Account.findByPk(AID);
    if (!account) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }
    account.Status = 0;
    try {
        await account.save();
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
    cache.del(`refreshToken:${AID}`);
    return res.json({ message: 'Khóa tài khoản thành công' });
}

async function unlockAccount(req, res) {
    let AID = req.body.id;
    if (!AID) {
        return res.status(400).json({ message: 'Thiếu AID' });
    }
    let account = await Account.findByPk(AID);
    if (!account) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }
    account.Status = 1;
    try {
        await account.save();
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
    return res.json({ message: 'Mở khóa tài khoản thành công' });
}

async function toAccountDetails(req, res) {
    let AID = req.query.id;
    if (!AID) {
        return res.redirect('/admin/toAccount');
    }
    let account = await Account.findByPk(AID);
    if (!account) {
        return res.redirect('/admin/toAccount');
    }
    let avatarImages = await AvatarImage.findAll();
    let matches = await MatchHistory.findAll({
        where: { AID1: AID },
        include: {
            model: Account,
            as: 'Player 2'
        }
    });
    let status = parseInt(req.query.status, 10) || 0;
    let message = '';
    switch (status) {
        case 1:
            message = 'Cập nhật thông tin thành công';
            break;
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Tên tài khoản đã được dùng';
            break;
        case -3:
            message = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    return res.render('accountdetails', {
        account: account,
        avatarImages: avatarImages,
        matches: matches,
        status: status,
        message: message
    });
}

async function editAccount(req, res) {
    let AID = req.body.aid;
    if (!AID) {
        return res.redirect('/admin/toAccount');
    }
    let account = await Account.findByPk(AID);
    if (!account) {
        return res.redirect('/admin/toAccount');
    }
    let username = req.body.username;
    if (!username || username.trim().length < 3 || username.trim().length > 50) {
        return res.redirect(`/admin/toAccountDetails?id=${AID}&status=-1`);
    }
    let score = parseInt(req.body.score, 10);
    if (!score || score < 0) {
        return res.redirect(`/admin/toAccountDetails?id=${AID}&status=-1`);
    }
    let status = req.body.status;
    if (!status || (status != 0 && status != 1)) {
        return res.redirect(`/admin/toAccountDetails?id=${AID}&status=-1`);
    }
    let usedUsername = await Account.findOne({
        where: {
            Username: username.trim(),
            AID: { [Op.ne]: AID }
        }
    });
    if (usedUsername) {
        return res.redirect(`/admin/toAccountDetails?id=${AID}&status=-2`);
    }
    account.Username = username.trim();
    account.Score = score;
    account.Status = status;
    try {
        await account.save();
    } catch (error) {
        return res.redirect(`/admin/toAccountDetails?id=${AID}&status=-3`);
    }
    cache.del(`refreshToken:${AID}`);
    return res.redirect(`/admin/toAccountDetails?id=${AID}&status=1`);
}

async function toWord(req, res) {
    let words = await Word.findAll();
    res.render('word', {
        title: 'Quản lý từ ngữ',
        current: 'word',
        words: words
    });
}

async function toAddWord(req, res) {
    let posList = await PartOfSpeech.findAll();
    let status = parseInt(req.query.status, 10) || 0;
    let message = '';
    switch (status) {
        case 1:
            message = 'Thêm từ thành công';
            break;
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Từ không hợp lệ';
            break;
        case -3:
            message = 'Từ đã tồn tại';
            break;
        case -4:
            message = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    return res.render('addword', {
        posList: posList,
        status: status,
        message: message
    });
}

async function addWord(req, res) {
    let wordV = req.body.wordV?.trim();
    let popularity = parseFloat(req.body.popularity);
    if (!wordV || !popularity) {
        return res.redirect('/admin/toAddWord?status=-1');
    }
    if (wordV.length > 30 || popularity < 1 || popularity > 9) {
        return res.redirect('/admin/toAddWord?status=-1');
    }
    if (wordV.split().length > 1) {
        return res.redirect('/admin/toAddWord?status=-2');
    }
    let pattern = /^[a-zA-Z]+$/;
    if (!pattern.test(wordV)) {
        return res.redirect('/admin/toAddWord?status=-2');
    }
    let existingWord = await Word.findByPk(wordV);
    if (existingWord) {
        return res.redirect('/admin/toAddWord?status=-3');
    }
    let newWord = new Word({
        WordV: wordV,
        Popularity: popularity
    });
    try {
        await newWord.save();
    } catch (error) {
        console.log('Lỗi khi thêm từ mới', error);
        return res.redirect('/admin/toAddWord?status=-4');
    }
    return res.redirect('/admin/toAddWord?status=1');
}

async function deleteWord(req, res) {
    let wordV = req.body.id;
    if (!wordV) {
        return res.status(400).json({ message: 'Thiếu từ' });
    }
    let word = await Word.findByPk(wordV);
    if (!word) {
        return res.status(404).json({ message: 'Không tìm thấy từ' });
    }
    try {
        let transaction = await db.transaction();
        await WordMeaning.destroy({
            where: { WordV: wordV },
            transaction: transaction
        });
        await WordHistory.destroy({
            where: { WordV: wordV },
            transaction: transaction
        });
        await Bookmark.destroy({
            where: { WordV: wordV },
            transaction: transaction
        });
        await word.destroy({ transaction: transaction });
        await transaction.commit();
    } catch (error) {
        console.log('Lỗi khi xóa từ', error);
        return res.status(500).json({ message: 'Lỗi khi xóa từ' });
    }
    return res.json({ message: 'Xóa từ thành công' });
}

async function toWordDetails(req, res) {
    let wordV = req.query.id;
    if (!wordV) {
        return res.redirect('/admin/toWord');
    }
    let word = await Word.findOne({
        where: { WordV: wordV },
        include: {
            model: WordMeaning,
            include: PartOfSpeech
        }
    });
    if (!word) {
        return res.redirect('/admin/toWord');
    }
    let posList = await PartOfSpeech.findAll();
    let statusW = parseInt(req.query.statusW, 10) || 0;
    let messageW = '';
    switch (statusW) {
        case 1:
            messageW = 'Cập nhật từ thành công';
            break;
        case -1:
            messageW = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            messageW = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    let statusM = parseInt(req.query.statusM, 10) || 0;
    let messageM = '';
    switch (statusM) {
        case 1:
            messageM = 'Thêm nghĩa thành công';
            break;
        case -1:
            messageM = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            messageM = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    return res.render('worddetails', {
        word: word,
        posList: posList,
        statusW: statusW,
        messageW: messageW,
        statusM: statusM,
        messageM: messageM
    });
}

async function editWord(req, res) {
    let wordV = req.body.wordV;
    let popularity = req.body.popularity;
    if (!wordV || !popularity) {
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusW=-1`);
    }
    if (popularity < 1 || popularity > 9) {
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusW=-1`);
    }
    let word = await Word.findByPk(wordV);
    if (!word) {
        return res.redirect('/admin/toWord');
    }
    word.Popularity = popularity;
    try {
        await word.save();
    } catch (error) {
        console.log('Lỗi khi chỉnh sửa từ', error);
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusW=-2`);
    }
    return res.redirect(`/admin/toWordDetails?id=${wordV}&statusW=1`);
}

async function addMeaning(req, res) {
    let wordV = req.body.wordV;
    let pos = req.body.pos;
    let phonetic = req.body.phonetic?.trim() || null;;
    let definition = req.body.definition?.trim();
    let example = req.body.example?.trim() || null;
    if (!wordV || !pos || !definition) {
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-1`);
    }
    let word = await Word.findByPk(wordV);
    if (!word) {
        return res.redirect('/admin/toWord');
    }
    let partOfSpeech = await PartOfSpeech.findByPk(pos);
    if (!partOfSpeech) {
        return res.redirect('/admin/toWord');
    }
    if (phonetic) {
        if (phonetic.length > 50) {
            return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-1`);
        }
        let pattern = /^\/[\p{L}\p{M}ˈˌːˑ.\-\s]+\/$/u;
        if (phonetic && !pattern.test(phonetic)) {
            return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-1`);
        }
    }
    if (definition.length > 500) {
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-1`);
    }
    if (example && example.length > 500) {
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-1`);
    }
    let newMeaning = new WordMeaning({
        WordV: word.WordV,
        POSID: partOfSpeech.POSID,
        Phonetic: phonetic,
        Definition: definition,
        Example: example
    });
    try {
        await newMeaning.save();
    } catch (error) {
        console.log('Lỗi khi tạo nghĩa mới', error);
        return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=-2`);
    }
    return res.redirect(`/admin/toWordDetails?id=${wordV}&statusM=1`);
}

async function deleteMeaning(req, res) {
    let wmid = req.body.id;
    if (!wmid) {
        return res.status(400).json({ message: 'Thiếu WMID' });
    }
    let meaning = await WordMeaning.findByPk(wmid);
    if (!meaning) {
        return res.status(404).json({ message: 'Không tìm thấy nghĩa' });
    }
    try {
        await meaning.destroy();
    } catch (error) {
        console.log('Lỗi khi xóa nghĩa', error);
        return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
    return res.status(200).json({ message: 'Xóa nghĩa thành công' });
}

async function toEditMeaning(req, res) {
    let wmid = req.query.id;
    if (!wmid) {
        return res.redirect('/admin/toWord');
    }
    let meaning = await WordMeaning.findByPk(wmid);
    if (!meaning) {
        return res.redirect('/admin/toWord');
    }
    let posList = await PartOfSpeech.findAll();
    let status = parseInt(req.query.status, 10) || 0;
    let message = '';
    switch (status) {
        case 1:
            message = 'Cập nhật nghĩa thành công';
            break;
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    return res.render('editmeaning', {
        meaning: meaning,
        posList: posList,
        status: status,
        message: message
    });
}

async function editMeaning(req, res) {
    let id = req.body.id;
    let pos = req.body.pos;
    let phonetic = req.body.phonetic?.trim() || null;
    let definition = req.body.definition?.trim();
    let example = req.body.example?.trim() || null;
    if (!id || !pos || !definition) {
        return res.redirect('/admin/toWord');
    }
    let meaning = await WordMeaning.findByPk(id);
    if (!meaning) {
        return res.redirect('/admin/toWord');
    }
    let partOfSpeech = await PartOfSpeech.findByPk(pos);
    if (!partOfSpeech) {
        return res.redirect('/admin/toWord');
    }
    if (phonetic) {
        if (phonetic.length > 50) {
            res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=1`);
        }
        let pattern = /^\/[\p{L}\p{M}ˈˌːˑ.\-\s]+\/$/u;
        if (phonetic && !pattern.test(phonetic)) {
            return res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=-1`);
        }
    }
    if (definition.length > 500) {
        return res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=-1`);
    }
    if (example && example.length > 500) {
        return res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=-1`);
    }
    meaning.POSID = partOfSpeech.POSID;
    meaning.Phonetic = phonetic;
    meaning.Definition = definition;
    meaning.Example = example;
    try {
        await meaning.save();
    } catch (error) {
        console.log('Lỗi khi chỉnh sửa nghĩa', error);
        return res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=-2`);
    }
    return res.redirect(`/admin/toEditMeaning?id=${meaning.WMID}&status=1`);
}

function toChangePass(req, res) {
    let status = parseInt(req.query.status, 10) || 0;
    let message = '';
    switch (status) {
        case 1:
            message = 'Đổi mật khẩu thành công';
            break;
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Mật khẩu cũ không đúng';
            break;
        case -3:
            message = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    res.render('changepass', {
        status: status,
        message: message
    });
}

async function changePass(req, res) {
    let email = req.authorization.email;
    let oldPass = req.body.oldPass?.trim();
    let newpass = req.body.newPass?.trim();
    if (!oldPass || !newpass || newpass.length < 8 || newpass.length > 64) {
        return res.redirect('/admin/toChangePass?status=-1');
    }
    let admin = await Admin.findOne({
        where: {
            Email: email,
            APassword: authentication.hash(oldPass)
        }
    });
    if (!admin) {
        return res.redirect('/admin/toChangePass?status=-2');
    }
    admin.APassword = authentication.hash(newpass);
    try {
        await admin.save();
        let refresh = authentication.signRefreshToken({
            email: email
        });
        cache.set(`Admin:${email}`, refresh);
        res.cookie('refreshToken', refresh, {
            httpOnly: true,
            signed: true
        });
    } catch (error) {
        console.log('Lỗi khi đổi mật khẩu', error);
        return res.redirect('/admin/toChangePass?status=-3');
    }
    return res.redirect('/admin/toChangePass?status=1');
}

function toResetPass(req, res) {
    let status = parseInt(req.query.status, 10) || 0;
    let message = '';
    switch (status) {
        case 1:
            message = 'Đặt lại mật khẩu thành công, kiểm tra email của bạn để nhận mật khẩu mới';
            break;
        case -1:
            message = 'Vui lòng nhập đầy đủ thông tin';
            break;
        case -2:
            message = 'Tài khoản không tồn tại';
            break;
        case -3:
            message = 'Mã OTP không đúng';
            break;
        case -4:
            message = 'Lỗi hệ thống, vui lòng thử lại sau';
            break;
    }
    res.render('resetpass', {
        status: status,
        message: message
    });
}

async function sendOTP(req, res) {
    let email = req.body.email?.trim();
    if (!email) {
        return res.status(400).json({ message: 'Thiếu email' });
    }
    let admin = await Admin.findByPk(email);
    if (!admin) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }
    let subject = 'Mã OTP đặt lại mật khẩu';
    let number = Math.floor(Math.random() * 900000) + 100000;
    let html = `<p>Mã xác thực của bạn là: <b>${number}</b></p><p>Mã có hiệu lực trong vòng 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai khác.</p>`;
    try {
        await sendEmail(admin.Email, subject, html);
        cache.set(`AdminOTP:${admin.Email}`, number);
        return res.json({ message: 'Đã gửi OTP' });
    } catch (error) {
        console.log('Lỗi gửi OTP', error);
        return res.status(500).json({ message: 'Lỗi gửi email' });
    }
}

async function resetPass(req, res) {
    let email = req.body.email?.trim();
    let otp = req.body.otp;
    if (!email) {
        return res.redirect('/admin/toResetPass?status=-1');
    }
    let admin = await Admin.findByPk(email);
    if (!admin) {
        return res.redirect('/admin/toResetPass?status=-2');
    }
    if (cache.get(`AdminOTP:${admin.Email}`) != otp) {
        return res.redirect('/admin/toResetPass?status=-3');
    }
    cache.del(`AdminOTP:${admin.Email}`);
    let newPass = authentication.hash(Math.random().toString());
    admin.APassword = authentication.hash(newPass);
    try {
        await admin.save();
        let subject = 'Mật khẩu mới';
        let html = `<p>Mật khẩu mới của bạn là: <b>${newPass}</b></p>`;
        await sendEmail(admin.Email, subject, html);
        return res.redirect('/admin/toResetPass?status=1');
    } catch (error) {
        console.log('Lỗi khi đặt lại mật khẩu', error);
        return res.redirect('/admin/toResetPass?status=-4');
    }
}

module.exports = { toIndex, verify, dangNhap, dangXuat, toReport, toAccount, lockAccount, unlockAccount, toAccountDetails, editAccount, toWord, toAddWord, addWord, deleteWord, toWordDetails, editWord, addMeaning, deleteMeaning, toEditMeaning, editMeaning, toChangePass, changePass, toResetPass, sendOTP, resetPass }
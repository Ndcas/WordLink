const Account = require('../models/account');
const Admin = require('../models/admin');
const AvatarImage = require('../models/avatarimage');
const MatchHistory = require('../models/matchhistory');
const authentication = require('../services/authentication');
const cache = require('../services/cache');
const { Op } = require('sequelize');

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
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.redirect('/admin?status=-1');
    }
    email = email.trim();
    password = password.trim();
    if (email.length == 0 || password.length == 0) {
        return res.redirect('/admin?status=-2');
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
    await account.save();
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
    await account.save();
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
    let status = parseInt(req.query.status, 10) ?? 0;
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
    if (!username || username.trim().length < 3) {
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
    await account.save();
    return res.redirect(`/admin/toAccountDetails?id=${AID}&status=1`);
}

async function toWord(req, res) {
    res.render('word', {
        title: 'Quản lý từ ngữ',
        current: 'word'
    });
}

function toChangePass(req, res) {
    res.render('changepass', {
        email: req.authorization.email
    });
}

module.exports = { toIndex, verify, dangNhap, dangXuat, toReport, toAccount, lockAccount, unlockAccount, toAccountDetails, editAccount, toWord, toChangePass }
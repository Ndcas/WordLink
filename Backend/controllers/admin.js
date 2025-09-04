const Admin = require('../models/admin');
const db = require('../services/database');
const authentication = require('../services/authentication');
const cache = require('../services/cache');

function toIndex(req, res) {
    res.render('index', {
        status: 0
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
    next();
}

async function dangNhap(req, res) {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.render('index', {
            message: 'Hãy nhập đầy đủ thông tin',
            status: -1
        });
    }
    email = email.trim();
    password = password.trim();
    if (email.length == 0 || password.length == 0) {
        return res.render('index', {
            message: 'Hãy nhập đầy đủ thông tin',
            status: -1
        });
    }
    password = authentication.hash(password);
    let admin = await Admin.findOne({
        where: {
            Email: email,
            APassword: password
        }
    });
    if (!admin) {
        return res.render('index', {
            message: 'Email hoặc mật khẩu không đúng',
            status: -1
        });
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

module.exports = { toIndex, verify, dangNhap, dangXuat, toReport }
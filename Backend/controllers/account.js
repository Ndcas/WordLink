const Account = require('../models/account');
const authentication = require('../services/authentication');
const sendEmail = require('../services/mail');
const cacheClient = require('../services/cache');
const validator = require('validator');

let appEmail = process.env.APP_EMAIL;

async function getOTP(req, res) {
    let email = req.body.email;
    if (!email) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    let number = Math.floor(Math.random() * 900000) + 100000;
    try {
        await sendEmail(email, 'Mã xác thực', `<p>Mã xác thực của bạn là: <b>${number}</b></p><p>Mã có hiệu lực trong vòng 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai khác.</p>`);
        cacheClient.set(`otp:${email}`, number, 300);
        return res.status(200).json({ message: 'Mã xác thực đã được gửi đến email của bạn' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Lỗi gửi email' });
    }
}

function verifyAccessToken(req, res, next) {
    if (!req.header('Authorization')) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let accessToken = req.header('Authorization').split(' ').length > 1 ? req.header('Authorization').split(' ')[1] : null;
    if (!accessToken) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let payload = authentication.verifyAccessToken(accessToken);
    if (!payload) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    req.authorization = payload;
    next();
}

function refreshAccessToken(req, res) {
    if (!req.header('Authorization')) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let refreshToken = req.header('Authorization').split(' ').length > 1 ? req.header('Authorization').split(' ')[1] : null;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let payload = authentication.verifyRefresh(refreshToken);
    if (!payload) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    if (refreshToken !== cacheClient.get(`refreshToken:${payload.AID}`)) {
        return res.status(401).json({ error: 'Xin hãy đăng nhập lại' });
    }
    let accessToken = authentication.signAccessToken(payload);
    return res.status(200).json({
        message: 'Làm mới token thành công',
        accessToken: accessToken
    });
}

async function signUp(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let otp = req.body.otp;
    if (!username || !password || !email || !otp) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    if (password.trim().length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Tên tài khoản phải có từ 3 đến 50 ký tự' });
    }
    if (cacheClient.take(`otp:${email}`) !== otp) {
        return res.status(400).json({ error: 'Mã xác thực không đúng hoặc đã hết hạn' });
    }
    try {
        await Account.create({
            Username: username,
            APassword: authentication.hashPassword(password),
            Email: email,
            Role: 0,
            Status: 1,
            Score: 0
        });
        return res.status(200).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        return res.status(400).json({ error: 'Tên tài khoản hoặc email đã tồn tại' });
    }
}

async function logIn(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let account = await Account.findOne({
            where: {
                Username: username,
                APassword: authentication.hashPassword(password),
                Role: 0,
            }
        });
        if (!account) {
            return res.status(404).json({ error: 'Tên tài khoản hoặc mật khẩu không đúng' });
        }
        if (account.Status === 0) {
            return res.status(403).json({ error: `Tài khoản này đã bị khóa, vui lòng liên hệ ${appEmail} để kháng cáo` });
        }
        let payload = {
            AID: account.AID,
            Username: account.Username
        }
        let accessToken = authentication.signAccessToken(payload);
        let refreshToken = authentication.signRefreshToken(payload);
        cacheClient.set(`refreshToken:${account.AID}`, refreshToken);
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function quickLogIn(req, res) {
    if (!req.header('Authorization')) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let refreshToken = req.header('Authorization').split(' ').length > 1 ? req.header('Authorization').split(' ')[1] : null;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Thiếu token' });
    }
    let payload = authentication.verifyRefreshToken(refreshToken);
    if (!payload) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    if (refreshToken !== cacheClient.get(`refreshToken:${payload.AID}`)) {
        return res.status(401).json({ error: 'Xin hãy đăng nhập lại' });
    }
    let accessToken = authentication.signAccessToken(payload);
    refreshToken = authentication.signRefreshToken(payload);
    cacheClient.set(`refreshToken:${payload.AID}`, refreshToken);
    return res.status(200).json({
        message: 'Đăng nhập thành công',
        accessToken: accessToken,
        refreshToken: refreshToken
    });
}

async function logInAdmin(req, res) {
    // let username = req.body.username;
    // let password = req.body.password;
    // if (!username || !password) {
    //     return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    // }
    // try {
    //     let account = await Account.findOne({
    //         where: {
    //             Username: username,
    //             APassword: authentication.hashPassword(password),
    //             Role: 1,
    //         }
    //     });
    //     if (!account) {
    //         return res.status(404).json({ error: 'Tên tài khoản hoặc mật khẩu không đúng' });
    //     }
    //     if (account.Status === 0) {
    //         return res.status(403).json({ error: `Tài khoản này đã bị khóa, vui lòng liên hệ ${appEmail} để kháng cáo` });
    //     }
    //     let payload = {
    //         AID: account.AID,
    //         Username: account.Username,
    //         Role: 1
    //     }
    //     let accessToken = authentication.signAccessToken(payload);
    //     let refreshToken = authentication.signRefreshToken(payload);
    //     cacheClient.set(`refreshToken:${account.AID}`, refreshToken);
    //     return res.status(200).json({
    //         message: 'Đăng nhập thành công',
    //         accessToken: accessToken,
    //         refreshToken: refreshToken
    //     });
    // } catch (error) {
    //     return res.status(500).json({ error: 'Lỗi hệ thống' });
    // }
}

async function suspend(req, res) {
    // if (!req.authorization || req.authorization.Role !== 1) {
    //     return res.status(403).json({ error: 'Cần quyền admin' });
    // }
    // let aid = req.body.aid;
    // try {
    //     let account = await Account.findOne({
    //         AID: aid
    //     });
    //     if (!account) {
    //         return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    //     }
    //     cacheClient.del(`refreshToken:${aid}`);
    //     account.Status = 0;
    //     await account.save();
    //     return res.status(200).json({ message: 'Khóa tài khoản thành công' });
    // }
    // catch (error) {
    //     return res.status(500).json({ error: 'Lỗi server' });
    // }
}

module.exports = { getOTP, signUp, verifyAccessToken, refreshAccessToken, logIn, quickLogIn, logInAdmin, suspend };
const Account = require('../models/account');
const Admin = require('../models/admin');
const AvatarImage = require('../models/avatarimage');
const authentication = require('../services/authentication');
const sendEmail = require('../services/mail');
const cacheClient = require('../services/cache');
const validator = require('validator');
const db = require('../services/database');
const { QueryTypes } = require('sequelize');

const appEmail = process.env.APP_EMAIL;

async function getOTPSignUp(req, res) {
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
        console.log('Lỗi gửi OTP', error);
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
        let existingAccount = await Account.findOne({ where: { Username: username } });
        if (existingAccount) {
            return res.status(400).json({ error: 'Tên tài khoản đã tồn tại' });
        }
        existingAccount = await Account.findOne({ where: { Email: email } });
        if (existingAccount) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }
        let existingAdmin = await Admin.findOne({ where: { Email: email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }
        await Account.create({
            Username: username,
            APassword: authentication.hashPassword(password),
            Email: email,
            Status: 1,
            Score: 0,
            AIID: null
        });
        return res.status(200).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.log('Lỗi đăng ký', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
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
                APassword: authentication.hashPassword(password)
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
        console.log('Lỗi đăng nhập', error);
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

async function getAccountInfo(req, res) {
    let AID = req.authorization.AID;
    try {
        let account = await Account.findOne({ where: { AID: AID } });
        let avatarImage = await AvatarImage.findOne({
            where: { AIID: account.AIID },
            attributes: ['Name']
        });
        return res.status(200).json({
            Username: account.Username,
            Email: account.Email,
            AvatarImage: avatarImage.Name,
            Score: account.Score
        });
    } catch (error) {
        console.log('Lỗi lấy thông tin tài khoản', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getLeaderboard(req, res) {
    try {
        let leaderboard = await db.query(`SELECT rank() OVER(ORDER BY Score Desc) 'Rank', Username, Score FROM Account WHERE Status = 1 ORDER BY Rank ASC LIMIT 100`, {
            type: QueryTypes.SELECT
        });
        return res.status(200).json(leaderboard.toJSON());
    }
    catch (error) {
        console.log('Lỗi lấy bảng xếp hạng', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getAccountRank(req, res) {
    let AID = req.authorization.AID;
    try {
        let account = await db.query(`SELECT * FROM (SELECT rank() OVER(ORDER BY Score Desc) 'Rank', AID FROM Account WHERE Status = 1) Ranked WHERE AID = :AID`, {
            replacements: { AID: AID },
            type: QueryTypes.SELECT
        });
        return res.status(200).json({
            rank: account[0].Rank
        });
    } catch (error) {
        console.log('Lỗi lấy xếp hạng tài khoản', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function changePassword(req, res) {
    let AID = req.authorization.AID;
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (newPassword.trim().length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    try {
        let account = await Account.findOne({
            where: {
                AID: AID,
                APassword: authentication.hashPassword(oldPassword)
            }
        });
        if (!account) {
            return res.status(404).json({ error: 'Mật khẩu cũ không đúng' });
        }
        await Account.update({
            APassword: authentication.hashPassword(newPassword)
        }, {
            where: { AID: AID }
        });
        return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.log('Lỗi đổi mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getOTPResetPassword(req, res) {
    let username = req.body.username;
    if (!username) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let account = await Account.findOne({ where: { Username: username } });
        if (!account) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        }
        let number = Math.floor(Math.random() * 900000) + 100000;
        await sendEmail(account.Email, 'Mã xác thực', `<p>Mã xác thực của bạn là: <b>${number}</b></p><p>Mã có hiệu lực trong vòng 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai khác.</p>`);
        cacheClient.set(`otp:${account.Email}`, number, 300);
        return res.status(200).json({ message: 'Mã xác thực đã được gửi đến email của bạn' });
    } catch (error) {
        console.log('Lỗi gửi OTP để đặt lại mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi gửi email' });
    }
}

async function resetPassword(req, res) {
    let username = req.body.username;
    let newPassword = req.body.newPassword;
    let otp = req.body.otp;
    if (!username || !newPassword || !otp) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (newPassword.trim().length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    try {
        let account = await Account.findOne({ where: { Username: username } });
        if (!account) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        }
        if (cacheClient.take(`otp:${account.Email}`) !== otp) {
            return res.status(400).json({ error: 'Mã xác thực không đúng hoặc đã hết hạn' });
        }
        account.APassword = authentication.hashPassword(newPassword);
        await account.save();
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.log('Lỗi đặt lại mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function changeAvatarImage(req, res) {
    let AID = req.authorization.AID;
    let aiid = req.body.aiid;
    if (!aiid) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let avatarImage = await AvatarImage.findOne({ where: { AIID: aiid } });
        if (!avatarImage) {
            return res.status(404).json({ error: 'Ảnh đại diện không tồn tại' });
        }
        let account = await Account.findOne({ where: { AID: AID } });
        if (!account) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        }
        account.AIID = aiid;
        await account.save();
        return res.status(200).json({ message: 'Đổi ảnh đại diện thành công' });
    } catch (error) {
        console.log('Lỗi đổi ảnh đại diện', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

function logOut(req, res) {
    let AID = req.authorization.AID;
    cacheClient.del(`refreshToken:${AID}`);
    return res.status(200).json({ message: 'Đã đăng xuất' });
}

module.exports = { getOTPSignUp, signUp, verifyAccessToken, refreshAccessToken, logIn, quickLogIn, getAccountInfo, getLeaderboard, getAccountRank, changePassword, getOTPResetPassword, resetPassword, changeAvatarImage, logOut };
const Account = require('../models/account');
const Admin = require('../models/admin');
const AvatarImage = require('../models/avatarimage');
const MatchHistory = require('../models/matchhistory');
const WordHistory = require('../models/wordhistory');
const Word = require('../models/word');
const authentication = require('../services/authentication');
const sendEmail = require('../services/mail');
const cacheClient = require('../services/cache');
const validator = require('validator');
const db = require('../services/database');
const { QueryTypes, fn, col, Op } = require('sequelize');

const appEmail = process.env.APP_EMAIL;

async function getOTPSignUp(req, res) {
    let email = req.body.email;
    if (!email) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    try {
        let user = await Account.findOne({
            where: { Email: email }
        });
        if (user) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }
        let number = Math.floor(Math.random() * 900000) + 100000;
        await sendEmail(email, 'Mã xác thực đăng kí tài khoản', `<p>Mã xác thực của bạn là: <b>${number}</b></p><p>Mã có hiệu lực trong vòng 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai khác.</p>`);
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
    let payload = authentication.verifyRefreshToken(refreshToken);
    if (!payload) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    if (refreshToken != cacheClient.get(`refreshToken:${payload.AID}`)) {
        return res.status(401).json({ error: 'Xin hãy đăng nhập lại' });
    }
    payload = { AID: payload.AID }
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
    username = username.trim();
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    if (password.trim().length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Tên tài khoản phải có từ 3 đến 50 ký tự' });
    }
    if (cacheClient.get(`otp:${email}`) != otp) {
        return res.status(400).json({ error: 'Mã xác thực không đúng hoặc đã hết hạn' });
    }
    cacheClient.del(`otp:${email}`);
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
            APassword: authentication.hash(password),
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
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password || !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let account = await Account.findOne({
            where: {
                Email: email,
                APassword: authentication.hash(password)
            }
        });
        if (!account) {
            return res.status(404).json({ error: 'Tên tài khoản hoặc mật khẩu không đúng' });
        }
        if (account.Status == 0) {
            return res.status(403).json({ error: `Tài khoản này đã bị khóa, vui lòng liên hệ ${appEmail} để kháng cáo` });
        }
        let payload = { AID: account.AID }
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
    if (refreshToken != cacheClient.get(`refreshToken:${payload.AID}`)) {
        return res.status(401).json({ error: 'Xin hãy đăng nhập lại' });
    }
    payload = { AID: payload.AID }
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
        let avatarImage = null;
        if (account.AIID) {
            avatarImage = await AvatarImage.findOne({
                where: { AIID: account.AIID },
                attributes: ['Name']
            });
        }
        return res.status(200).json({
            Username: account.Username,
            Email: account.Email,
            AvatarImage: avatarImage ? avatarImage.Name : null,
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
        return res.status(200).json(leaderboard);
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
                APassword: authentication.hash(oldPassword)
            }
        });
        if (!account) {
            return res.status(404).json({ error: 'Mật khẩu cũ không đúng' });
        }
        await Account.update({
            APassword: authentication.hash(newPassword)
        }, {
            where: { AID: AID }
        });
        let refreshToken = authentication.signRefreshToken({ AID: AID });
        cacheClient.set(`refreshToken:${AID}`, refreshToken);
        return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.log('Lỗi đổi mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getOTPResetPassword(req, res) {
    let email = req.body.email;
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let account = await Account.findOne({ where: { Email: email } });
        if (!account) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        }
        let number = Math.floor(Math.random() * 900000) + 100000;
        await sendEmail(account.Email, 'Mã xác thực đặt lại mật khẩu', `<p>Mã xác thực của bạn là: <b>${number}</b></p><p>Mã có hiệu lực trong vòng 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai khác.</p>`);
        cacheClient.set(`otp:${email}`, number, 300);
        return res.status(200).json({ message: 'Mã xác thực đã được gửi đến email của bạn' });
    } catch (error) {
        console.log('Lỗi gửi OTP để đặt lại mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi gửi email' });
    }
}

async function resetPassword(req, res) {
    let email = req.body.email;
    let newPassword = req.body.newPassword;
    let otp = req.body.otp;
    if (!email || !newPassword || !otp || !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (newPassword.trim().length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    try {
        let account = await Account.findOne({ where: { Email: email } });
        if (!account) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' });
        }
        if (cacheClient.get(`otp:${email}`) != otp) {
            return res.status(400).json({ error: 'Mã xác thực không đúng hoặc đã hết hạn' });
        }
        cacheClient.del(`otp:${email}`)
        account.APassword = authentication.hash(newPassword);
        await account.save();
        cacheClient.del(`refreshToken:${account.AID}`);
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.log('Lỗi đặt lại mật khẩu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function changeUsernameAndAvatarImage(req, res) {
    let AID = req.authorization.AID;
    let username = req.body.username;
    let avatarName = req.body.avatarName;
    if (!username && !avatarName) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    if (username) {
        username = username.trim();
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Tên tài khoản phải có từ 3 đến 50 ký tự' });
        }
    }
    try {
        if (username) {
            let usedUsername = await Account.findOne({
                where: { Username: username }
            });
            if (usedUsername) {
                return res.status(400).json({ error: 'Tên tài khoản đã được sử dụng' });
            }
        }
        let avatarImage = avatarName ? await AvatarImage.findOne({
            where: { Name: avatarName }
        }) : null;
        if (avatarName && !avatarImage) {
            return res.status(400).json({ error: 'Không tìm thấy ảnh đại điện yêu cầu' });
        }
        let user = await Account.findOne({
            where: { AID: AID }
        });
        user.Username = username ? username : user.Username;
        user.AIID = avatarImage ? avatarImage.AIID : user.AIID;
        await user.save();
        return res.status(200).json({ message: 'Đổi thông tin tài khoản thành công' });
    } catch (error) {
        console.log('Lỗi khi đổi thông tin tài khoản', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getAnalyticReport(req, res) {
    let AID = req.authorization.AID;
    let cachedData = cacheClient.get(`analyticReport:${AID}`);
    if (cachedData) {
        return res.status(200).json(cachedData);
    }
    try {
        let numOfMatchesPlayed = await MatchHistory.count({
            where: { AID1: AID }
        });
        let pvpStat = await MatchHistory.findAll({
            attributes: [[fn('COUNT', col('MID')), 'count'], 'Result'],
            where: {
                AID1: AID,
                AID2: {
                    [Op.not]: null
                }
            },
            group: 'Result'
        });
        let pvpWin = 0;
        let pvpLose = 0;
        pvpStat.forEach((stat) => {
            if (stat.Result == 1) {
                pvpWin = stat.get('count');
            } else if (stat.Result == 0) {
                pvpLose = stat.get('count');
            }
        });
        let numOfWordsUsed = await WordHistory.count({
            where: { AID: AID }
        });
        let last100Words = await WordHistory.findAll({
            where: { AID: AID },
            include: {
                model: Word,
                attributes: ['Popularity']
            },
            limit: 100,
            order: [['UseTime', 'DESC']]
        });
        let count = last100Words.length;
        let avg = 0;
        let countMap = {}
        last100Words.forEach((word) => {
            avg += word.Word.Popularity;
            countMap[word.WordV] = countMap[word.WordV] ? countMap[word.WordV] + 1 : 1;
        });
        let sortedCountMap = Object.fromEntries(Object.entries(countMap).sort(([, a], [, b]) => b - a));
        avg = count > 0 ? Math.round(avg / count * 100) / 100 : 0;
        let result = {
            numOfMatchesPlayed: numOfMatchesPlayed,
            pvpWin: pvpWin,
            pvpLose: pvpLose,
            numOfWordsUsed: numOfWordsUsed,
            avgPopularity: avg,
            last100countMap: sortedCountMap
        }
        // Cache lại 10'
        cacheClient.set(`analyticReport:${AID}`, result, 600);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy báo cáo số liệu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

function logOut(req, res) {
    let AID = req.authorization.AID;
    cacheClient.del(`refreshToken:${AID}`);
    return res.status(200).json({ message: 'Đã đăng xuất' });
}

module.exports = { getOTPSignUp, signUp, verifyAccessToken, refreshAccessToken, logIn, quickLogIn, getAccountInfo, getLeaderboard, getAccountRank, changePassword, getOTPResetPassword, resetPassword, changeUsernameAndAvatarImage, getAnalyticReport, logOut };
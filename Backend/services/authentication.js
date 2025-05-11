const { sha256 } = require('js-sha256');
const jsonwebtoken = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;
const refreshKey = process.env.REFRESH_KEY;
const secretTTL = process.env.SECRET_TTL;
const refreshTTL = process.env.REFRESH_TTL;

function hash(string) {
    return sha256(string);
}

function signAccessToken(payload) {
    return jsonwebtoken.sign(payload, secretKey, {
        expiresIn: secretTTL
    });
}

function verifyAccessToken(token) {
    try {
        return jsonwebtoken.verify(token, secretKey);
    } catch (error) {
        return null;
    }
}

function signRefreshToken(payload) {
    return jsonwebtoken.sign(payload, refreshKey, {
        expiresIn: refreshTTL
    });
}

function verifyRefreshToken(token) {
    try {
        return jsonwebtoken.verify(token, refreshKey);
    } catch (error) {
        return null;
    }
}

module.exports = { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, hash };
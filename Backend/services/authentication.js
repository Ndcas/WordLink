const { sha256 } = require('js-sha256');
const jsonwebtoken = require('jsonwebtoken');

let secretKey = process.env.SECRET_KEY;
let refreshKey = process.env.REFRESH_KEY;
let secretTTL = process.env.SECRET_TTL;
let refreshTTL = process.env.REFRESH_TTL;

function hash(string) {
    return sha256(string);
}

function sign(payload) {
    return jsonwebtoken.sign(payload, secretKey, {
        expiresIn: secretTTL
    });
}

function verifyJWT(token) {
    try {
        return jsonwebtoken.verify(token, secretKey);
    } catch (error) {
        return null;
    }
}

function signRefresh(payload) {
    return jsonwebtoken.sign(payload, refreshKey, {
        expiresIn: refreshTTL
    });
}

function verifyRefresh(token) {
    try {
        return jsonwebtoken.verify(token, refreshKey);
    } catch (error) {
        return null;
    }
}

module.exports = { sign, verifyJWT, signRefresh, verifyRefresh, hash };
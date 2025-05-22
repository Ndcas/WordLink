const authentication = require("./authentication");
const cacheClient = require("./cacheClient");
const Word = require('../models/word');
const WordHistory = require('../models/wordhistory');
const MatchHistory = require('../models/matchhistory');
const Account = require('../models/account');
const Bookmark = require('../models/bookmark');
const db = require('../services/database');

let queue = [];
let matches = {};

// Kiểm tra xem refresh token còn hợp lệ hay không
function verify(socket) {
    let refreshToken = socket.data.refreshToken;
    if (!refreshToken) {
        socket.emit('authentication failed', { error: 'Socket không chứa refresh token' });
        return false;
    }
    let payload = authentication.verifyRefreshToken(refreshToken);
    if (!payload || cacheClient.get(`refreshToken:${payload.AID}`) !== refreshToken) {
        socket.emit('authentication failed', { error: 'Socket chứa refresh token không hợp lệ' });
        return false;
    }
    return true;
}

// Tạo ID cho trận đấu
function generateMatchID() {
    let valid = false;
    let matchID = null;
    while (!valid) {
        let matchID = `${Date.now()}-${Math.floor(Math.random() * 100)}`;
        if (!matches[matchID]) {
            valid = true;
        }
    }
    return matchID;
}

// Kiểm tra tính hợp lệ của từ
async function verifyWord(word, usedWords) {
    if (usedWords.includes(word)) {
        return false;
    }
    if (usedWords.length >= 1) {
        let oldWord = usedWords[usedWords.length - 1];
        if (oldWord[oldWord.length - 1] !== word[0]) {
            return false;
        }
    }
    let wordInDB = await Word.findOne({
        where: {
            WordV: word
        }
    });
    return wordInDB ? true : false;
}

// Xử lý thắng thua
async function handleWinLose(matchID) {
    let match = matches[matchID];
    if (!match || !match.playing) {
        return {
            error: 'Trận đấu đã kết thúc hoặc đang được xử lý'
        };
    }
    match.status = false;
    let player1 = match.player1;
    let player2 = match.player2;
    let turn = match.turn;
    let usedWords = match.usedWords;
    let wordUsedByPlayer1 = usedWords.filter((word, index) => {
        return index % 2 === 0;
    });
    let wordUsedByPlayer2 = usedWords.filter((word, index) => {
        return index % 2 === 1;
    });
    let transaction = null;
    let result = {};
    try {
        transaction = await db.transaction();
        // Xử lý người chơi 1
        let sumPopularity1 = await Word.sum('Popularity', {
            where: {
                WordV: {
                    [Op.in]: wordUsedByPlayer1
                }
            }
        });
        let user1 = await Account.findOne({
            where: {
                AID: player1.data.AID
            }
        });
        let bookmarks1 = await Bookmark.findAll({
            where: {
                AID: player1.data.AID,
                WordV: {
                    [Op.in]: usedWords
                }
            }
        });
        let newWords1 = usedWords.filter((word) => {
            return !bookmarks1.some((bookmark) => {
                return bookmark.WordV === word;
            });
        });
        let score1 = 0;
        if (player2 == null) {
            score1 = Math.floor((9 * wordUsedByPlayer1.length - sumPopularity1) * 0.1);
        } else {
            score1 = Math.floor(9 * wordUsedByPlayer1.length - sumPopularity1);
        }
        score1 = score1 > 0 ? score1 : 0;
        let oldScore1 = user1.Score;
        if (turn % 2 === 0 && player2) {
            user1.Score = Math.floor(user1.Score * 0.95 + score1);
        } else {
            user1.Score = Math.floor(user1.Score + score1);
        }
        await user1.save({ transaction: transaction });
        await MatchHistory.create({
            AID1: player1.data.AID,
            AID2: player2 ? player2.data.AID : null,
            ScoreD: user1.Score - oldScore1,
            Result: turn % 2
        }, {
            transaction: transaction
        });
        result.player1 = {
            socket: player1,
            result: turn % 2,
            score: user1.Score,
            scoreD: user1.Score - oldScore1,
            newWords: newWords1
        }
        // Xử lý người chơi 2
        if (!player2) {
            result.player2 = null;
        } else {
            let sumPopularity2 = await Word.sum('Popularity', {
                where: {
                    WordV: {
                        [Op.in]: wordUsedByPlayer2
                    }
                }
            });
            let user2 = await Account.findOne({
                where: {
                    AID: player2.data.AID
                }
            });
            let bookmarks2 = await Bookmark.findAll({
                where: {
                    AID: player2.data.AID,
                    WordV: {
                        [Op.in]: usedWords
                    }
                }
            });
            let newWords2 = usedWords.filter((word) => {
                return !bookmarks2.some((bookmark) => {
                    return bookmark.WordV === word;
                });
            });
            let score2 = Math.floor(9 * wordUsedByPlayer2.length - sumPopularity2);
            score2 = score2 > 0 ? score2 : 0;
            let oldScore2 = user2.Score;
            if (turn % 2 === 0) {
                user2.Score = Math.floor(user2.Score + score2);
            } else {
                user2.Score = Math.floor(user2.Score * 0.95 + score2);
            }
            await user2.save({ transaction: transaction });
            await MatchHistory.create({
                AID1: player2.data.AID,
                AID2: player1.data.AID,
                ScoreD: user2.Score - oldScore2,
                Result: turn % 2 === 0 ? 1 : 0
            }, {
                transaction: transaction
            });
            result.player2 = {
                socket: player2,
                result: turn % 2 === 0 ? 1 : 0,
                score: user2.Score,
                scoreD: user2.Score - oldScore2,
                newWords: newWords2
            }
        }
        await transaction.commit();
        return result;
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        console.log('Lỗi xử lý thắng thua', error);
        return null;
    } finally {
        delete matches[matchID];
    }
}

// Xử lý khi client kết nối sau đó gửi refresh token
function connect(socket) {
    socket.data = {};
    socket.on('authentication', (refreshToken) => {
        if (!refreshToken) {
            socket.emit('authentication failed', { error: 'Thiếu refresh token' });
            return;
        }
        let payload = authentication.verifyRefreshToken(refreshToken);
        if (!payload || cacheClient.get(`refreshToken:${payload.AID}`) !== refreshToken) {
            socket.emit('authentication failed', { error: 'Refresh token không hợp lệ' });
            return;
        }
        socket.data.AID = payload.AID;
        socket.data.Username = payload.Username;
        socket.data.refreshToken = refreshToken;
    });
}

// Thông báo sắp ngắt kết nối sau đó ngắt kết nối
function disconnect(socket) {
    socket.emit('disconnecting');
    socket.disconnect();
}

// Xử lý khi người chơi muốn chơi với bot
function playWithBot(socket) {
    // Khởi tạo trận đấu với bot
    socket.on('play with bot', () => {
        if (!verify(socket)) {
            return;
        }
        let matchID = generateMatchID();
        socket.data.matchID = matchID;
        matches[matchID] = {
            player1: socket,
            player2: null,
            turn: 0,
            usedWords: [],
            playing: true
        };
        socket.emit('your turn', {
            currentWord: null,
            usedWords: []
        });
    });
    // Xử lý khi người chơi gửi từ
    socket.on('send word to bot', async (word) => {
        if (!verify(socket)) {
            return;
        }
        if (!word) {
            socket.emit('invalid word', { error: 'Thiếu từ' });
            return;
        }
        word = word.toLowerCase();
        try {
            let usedWords = matches[socket.data.matchID].usedWords;
            if (!(await verifyWord(word, usedWords))) {
                socket.emit('invalid word', { error: 'Từ không hợp lệ' });
                return;
            }
            usedWords.push(word);
            matches[socket.data.matchID].turn++;
            await WordHistory.create({
                AID: socket.data.AID,
                WordV: word
            });
            let count = await Word.count({
                where: {
                    WordV: {
                        [Op.notIn]: usedWords,
                        [Op.like]: `${word[word.length - 1]}%`
                    }
                }
            });
            if (count !== 0) {
                let offset = Math.floor(Math.random() * count);
                let wordToUse = Word.findOne({
                    where: {
                        [Op.notIn]: usedWords,
                        [Op.like]: `${word[word.length - 1]}%`
                    },
                    offset: offset
                });
                usedWords.push(wordToUse);
                matches[socket.data.matchID].turn++;
                socket.emit('your turn', {
                    currentWord: wordToUse,
                    usedWords: usedWords
                });
                return;
            }
            // Xử lý khi không còn từ nào để sử dụng
            let result = await handleWinLose(socket.data.matchID);
            if (result) {
                socket.emit('send match result', {
                    score: result.player1.score,
                    scoreD: result.player1.scoreD,
                    result: result.player1.result,
                    newWords: result.player1.newWords
                });
                disconnect(socket);
                return;
            }
            throw new Error('Lỗi xử lý trận đấu');
        } catch (error) {
            delete matches[socket.data.matchID];
            console.log('Lỗi xử lý từ chơi với bot', error);
            socket.emit('Lỗi hệ thống');
            disconnect(socket);
        }
    });
    // Xử lý khi người chơi không có từ phù hợp
    socket.on('bot win', async () => {
        if (!verify(socket)) {
            return;
        }
        let result = await handleWinLose(socket.data.matchID);
        if (!result) {
            return;
        }
        if (result) {
            socket.emit('send match result', {
                score: result.player1.score,
                scoreD: result.player1.scoreD,
                result: result.player1.result,
                newWords: result.player1.newWords
            });
        }
        else {
            socket.emit('Lỗi hệ thống');
        }
        disconnect(socket);
    });
}

// Xur lý khi người chơi muốn chơi với người khác
async function playWithPlayer(socket) {
}

// Xử lý khi người chơi ngắt kết nối đột ngột
function unexpectedDisconnection(socket) {
    socket.on('disconnect', async () => {
        if (!socket.data.matchID) {
            return;
        }
        let player1Socket = matches[socket.data.matchID].player1;
        let player2Socket = matches[socket.data.matchID].player2;
        let matchResult = await handleWinLose(socket.data.matchID);
        if (!matchResult) {
            if (player1Socket.id !== socket.id) {
                player1Socket.emit('Lỗi xử lý thắng thua khi đối thủ ngắt kết nối');
                disconnect(player1Socket);
            } else if (player2Socket && player2Socket.id !== socket.id) {
                player2Socket.emit('Lỗi xử lý thắng thua khi đối thủ ngắt kết nối');
                disconnect(player2Socket);
            }
            return;
        }
        if (matchResult.player1.socket.id !== socket.id) {
            matchResult.player1.socket.emit('send match result', {
                score: matchResult.player1.score,
                scoreD: matchResult.player1.scoreD,
                result: matchResult.player1.result,
                newWords: matchResult.player1.newWords
            });
            disconnect(matchResult.player1.socket);
        }
        if (matchResult.player2 && matchResult.player2.socket.id !== socket.id) {
            matchResult.player2.socket.emit('send match result', {
                score: matchResult.player2.score,
                scoreD: matchResult.player2.scoreD,
                result: matchResult.player2.result,
                newWords: matchResult.player2.newWords
            });
            disconnect(matchResult.player2.socket);
        }
    });
}

module.exports = { connect, playWithBot, playWithPlayer, unexpectedDisconnection };
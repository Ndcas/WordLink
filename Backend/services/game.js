const { Op } = require('sequelize');
const authentication = require("./authentication");
const cacheClient = require("./cache");
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
    if (!payload || cacheClient.get(`refreshToken:${payload.AID}`) != refreshToken) {
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
    if (!word || word.trim() == '') {
        return { result: false }
    }
    word = word.toLowerCase().trim();
    if (usedWords.includes(word)) {
        return { result: false }
    }
    if (usedWords.length >= 1) {
        let oldWord = usedWords[usedWords.length - 1];
        if (oldWord[oldWord.length - 1] != word[0]) {
            return { result: false }
        }
    }
    try {
        let wordInDB = await Word.findOne({
            where: { WordV: word }
        });
        if (wordInDB) {
            return {
                result: true,
                word: wordInDB.WordV
            }
        }
        return { result: false }
    } catch (error) {
        console.log('Lỗi khi kiểm tra tính hợp lệ của từ', error);
        return false;
    }
}

// Xử lý thắng thua
// Trả về object khi xử lý thành công, 0 khi không tìm thấy trận, 1 khi trận đang được xử lý, -1 khi lỗi xử lý cở sở dữ liệu
async function handleWinLose(matchID, forceLossID) {
    let match = matches[matchID];
    if (!match) {
        return 0;
    }
    if (!match.playing) {
        return 1;
    }
    match.playing = false;
    let player1 = match.player1;
    let player2 = match.player2;
    let turn = match.turn;
    let usedWords = match.usedWords;
    let wordUsedByPlayer1 = usedWords.filter((word, index) => index % 2 == 0);
    let wordUsedByPlayer2 = usedWords.filter((word, index) => index % 2 == 1);
    let transaction = null;
    let result = {};
    try {
        transaction = await db.transaction();
        // Xử lý người chơi 1
        let sumPopularity1 = await Word.sum('Popularity', {
            where: {
                WordV: { [Op.in]: wordUsedByPlayer1 }
            }
        });
        let user1 = await Account.findOne({
            where: { AID: player1.data.AID }
        });
        let bookmarks1 = await Bookmark.findAll({
            where: {
                AID: player1.data.AID,
                WordV: { [Op.in]: usedWords }
            }
        });
        let newWords1 = usedWords.filter((word) => {
            return !bookmarks1.some((bookmark) => {
                return bookmark.WordV == word;
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
        let player1Result = (forceLossID != player1.id && turn % 2 == 1) ? 1 : 0;
        // Nếu chơi với bot hoặc thắng thì cộng điểm, nếu chơi với người và thua thì trừ 5% số điểm sau đó cộng điểm
        if (!player2 || player1Result == 1) {
            user1.Score = Math.floor(user1.Score + score1);
        } else {
            user1.Score = Math.floor(user1.Score * 0.95 + score1);
        }
        await user1.save({ transaction: transaction });
        await MatchHistory.create({
            AID1: player1.data.AID,
            AID2: player2 ? player2.data.AID : null,
            ScoreD: user1.Score - oldScore1,
            Result: player1Result
        }, { transaction: transaction });
        result.player1 = {
            socket: player1,
            result: player1Result,
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
                    WordV: { [Op.in]: wordUsedByPlayer2 }
                }
            });
            let user2 = await Account.findOne({
                where: { AID: player2.data.AID }
            });
            let bookmarks2 = await Bookmark.findAll({
                where: {
                    AID: player2.data.AID,
                    WordV: { [Op.in]: usedWords }
                }
            });
            let newWords2 = usedWords.filter((word) => {
                return !bookmarks2.some((bookmark) => {
                    return bookmark.WordV == word;
                });
            });
            let score2 = Math.floor(9 * wordUsedByPlayer2.length - sumPopularity2);
            score2 = score2 > 0 ? score2 : 0;
            let oldScore2 = user2.Score;
            let player2Result = (forceLossID != player2.id && turn % 2 == 0) ? 1 : 0;
            // Nếu thắng thì cộng điểm, nếu thua thì trừ 5% số điểm sau đó cộng điểm
            if (player2Result == 1) {
                user2.Score = Math.floor(user2.Score + score2);
            } else {
                user2.Score = Math.floor(user2.Score * 0.95 + score2);
            }
            await user2.save({ transaction: transaction });
            await MatchHistory.create({
                AID1: player2.data.AID,
                AID2: player1.data.AID,
                ScoreD: user2.Score - oldScore2,
                Result: player2Result
            }, { transaction: transaction });
            result.player2 = {
                socket: player2,
                result: player2Result,
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
        return -1;
    } finally {
        delete matches[matchID];
    }
}

// Xử lý khi client kết nối sau đó gửi refresh token và tên của avatar
// Hệ thống trả về event authentication failed, system error
function connect(socket) {
    socket.data = {};
    socket.on('authentication', async (refreshToken, avatarImage) => {
        if (!refreshToken) {
            socket.emit('authentication failed', { error: 'Thiếu refresh token' });
            return;
        }
        if (!avatarImage) {
            socket.emit('authentication failed', { error: 'Thiếu avatar image' });
            return;
        }
        let payload = authentication.verifyRefreshToken(refreshToken);
        if (!payload || cacheClient.get(`refreshToken:${payload.AID}`) != refreshToken) {
            socket.emit('authentication failed', { error: 'Refresh token không hợp lệ' });
            return;
        }
        try {
            let account = await Account.findOne({ AID: payload.AID });
            socket.data.AID = payload.AID;
            socket.data.Username = account.Username;
            socket.data.refreshToken = refreshToken;
            socket.data.avatarImage = avatarImage;
            socket.data.guest = false;
        } catch (error) {
            console.log('Lỗi khi lấy thông tin lưu vào socket', error);
            socket.emit('system error');
        }
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
    // Hệ thống trả về event invalid operation, your turn
    socket.on('play with bot', () => {
        if ((!socket.data.guest && !verify(socket)) || socket.data.matchID) {
            socket.emit('invalid operation');
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
    // Hệ thống trả về event invalid operation, invalid match, invalid word, your turn, match result, system error
    socket.on('send word to bot', async (word) => {
        if ((!socket.data.guest && !verify(socket)) || !socket.data.matchID) {
            socket.emit('invalid operation');
            return;
        }
        let match = matches[socket.data.matchID];
        if (!match || !match.playing) {
            socket.emit('invalid match');
            return;
        }
        try {
            let usedWords = match.usedWords;
            let wordCheck = await verifyWord(word, usedWords);
            if (!wordCheck.result) {
                socket.emit('invalid word');
                return;
            }
            usedWords.push(wordCheck.word);
            match.turn++;
            if (!socket.data.guest) {
                await WordHistory.create({
                    AID: socket.data.AID,
                    WordV: wordCheck.word
                });
            }
            let count = await Word.count({
                where: {
                    WordV: {
                        [Op.notIn]: usedWords,
                        [Op.like]: `${wordCheck.word[word.length - 1]}%`
                    }
                }
            });
            if (count != 0) {
                let offset = Math.floor(Math.random() * count);
                let wordToUse = Word.findOne({
                    where: {
                        [Op.notIn]: usedWords,
                        [Op.like]: `${wordCheck.word[word.length - 1]}%`
                    },
                    offset: offset
                });
                usedWords.push(wordToUse);
                match.turn++;
                socket.emit('your turn', {
                    currentWord: wordToUse,
                    usedWords: usedWords
                });
                return;
            }
            // Xử lý khi không còn từ nào để sử dụng
            if (socket.data.guest) {
                socket.emit('match result', { result: 1 });
                delete matches[socket.data.matchID];
                disconnect(socket);
                return;
            }
            let result = await handleWinLose(socket.data.matchID, null);
            if (result == 0) {
                socket.emit('invalid match');
                disconnect(socket);
                return;
            }
            if (result == -1 || result == 1) {
                socket.emit('system error');
                disconnect(socket);
                return;
            }
            socket.emit('match result', {
                score: result.player1.score,
                scoreD: result.player1.scoreD,
                result: result.player1.result,
                newWords: result.player1.newWords
            });
            disconnect(socket);
        } catch (error) {
            delete matches[socket.data.matchID];
            console.log('Lỗi xử lý từ chơi với bot', error);
            socket.emit('system error');
            disconnect(socket);
        }
    });
    // Xử lý khi người chơi không có từ phù hợp
    // Hệ thống trả về event invalid operation, match result, system error
    socket.on('bot win', async () => {
        if ((!socket.data.guest && !verify(socket)) || !socket.data.matchID) {
            socket.emit('invalid operation');
            return;
        }
        let match = matches[socket.data.matchID];
        if (!match || !match.playing) {
            socket.emit('invalid match');
            return;
        }
        if (socket.data.guest) {
            socket.emit('match result', { result: 0 });
            delete matches[socket.data.matchID];
            disconnect(socket);
            return;
        }
        let result = await handleWinLose(socket.data.matchID, null);
        if (result == 0) {
            socket.emit('invalid match');
            disconnect(socket);
            return;
        }
        if (result == -1 || result == 1) {
            socket.emit('system error');
            disconnect(socket);
            return;
        }
        socket.emit('match result', {
            score: result.player1.score,
            scoreD: result.player1.scoreD,
            result: result.player1.result,
            newWords: result.player1.newWords
        });
        disconnect(socket);
    });
}

// Xử lý khi người chơi muốn chơi với người khác
async function playWithPlayer(socket) {
    // Tìm trận
    // Hệ thống trả về event invalid operation, match found, your turn, waiting for a match
    socket.on('find match', () => {
        if (!verify(socket) || socket.data.matchID) {
            socket.emit('invalid operation');
            return;
        }
        if (queue.length > 0) {
            let otherPlayer = queue.shift();
            let matchID = generateMatchID();
            matches[matchID] = {
                player1: otherPlayer,
                player2: socket,
                turn: 0,
                usedWords: [],
                playing: true
            };
            otherPlayer.data.matchID = matchID;
            socket.data.matchID = matchID;
            otherPlayer.emit('match found', {
                opponent: socket.data.Username,
                avatarImage: socket.data.avatarImage
            });
            socket.emit('match found', {
                opponent: otherPlayer.data.Username,
                avatarImage: otherPlayer.data.avatarImage
            });
            otherPlayer.emit('your turn', {
                currentWord: null,
                usedWords: []
            });
        } else {
            queue.push(socket);
            socket.emit('waiting for a match');
        }
    });
    // Xử lý khi người chơi gửi từ
    // Hệ thống trả về event invalid operation, invalid match, invalid word, your turn, match result
    socket.on('send word to player', async (word) => {
        if (!verify(socket) || !socket.data.matchID) {
            socket.emit('invalid operation');
            return;
        }
        let match = matches[socket.data.matchID];
        if (!match || !match.playing) {
            socket.emit('invalid match');
            return;
        }
        if (match.turn % 2 == 0 && match.player2.id == socket.id) {
            socket.emit('invalid operation');
            return;
        } else if (match.turn % 2 == 1 && match.player1.id == socket.id) {
            socket.emit('invalid operation');
            return;
        }
        try {
            let usedWords = match.usedWords;
            let wordCheck = await verifyWord(word, usedWords);
            if (!wordCheck.result) {
                socket.emit('invalid word');
                return;
            }
            usedWords.push(wordCheck.word);
            match.turn++;
            await WordHistory.create({
                AID: socket.data.AID,
                WordV: wordCheck.word
            });
            let otherPlayer = match.player1.id == socket.id ? match.player2 : match.player1;
            otherPlayer.emit('your turn', {
                currentWord: wordCheck.word,
                usedWords: usedWords
            });
        } catch (error) {
            console.log('Lỗi xử lý từ chơi với người', error);
            let match = matches[socket.data.matchID];
            let otherPlayer = match.player1.id == socket.id ? match.player2 : match.player1;
            socket.emit('system error');
            disconnect(socket);
            otherPlayer.emit('system error');
            disconnect(otherPlayer);
            delete matches[socket.data.matchID];
        }
    });
    // Xử lý khi 1 người chơi không trả lời được từ phù hợp
    // Hệ thống trả về event invalid operation, invalid match, match result
    socket.on('other player win', async () => {
        if (!verify(socket) || !socket.data.matchID) {
            socket.emit('invalid operation');
            return;
        }
        let match = matches[socket.data.matchID];
        if (!match || !match.playing) {
            socket.emit('invalid match');
            return;
        }
        let otherPlayer = match.player1.id == socket.id ? match.player2 : match.player1;
        let matchResult = await handleWinLose(socket.data.matchID);
        if (matchResult == 0) {
            socket.emit('invalid match');
            otherPlayer.emit('invalid match');
            disconnect(otherPlayer);
            disconnect(socket);
            return;
        }
        if (matchResult == -1 || matchResult == 1) {
            socket.emit('system error');
            otherPlayer.emit('system error');
            disconnect(otherPlayer);
            disconnect(socket);
            return;
        }
        matchResult.player1.socket.emit('match result', {
            score: matchResult.player1.score,
            scoreD: matchResult.player1.scoreD,
            result: matchResult.player1.result,
            newWords: matchResult.player1.newWords
        });
        disconnect(matchResult.player1.socket);
        matchResult.player2.socket.emit('match result', {
            score: matchResult.player2.score,
            scoreD: matchResult.player2.scoreD,
            result: matchResult.player2.result,
            newWords: matchResult.player2.newWords
        });
        disconnect(matchResult.player2.socket);
    });
}

// Xử lý khi người chơi ngắt kết nối đột ngột
// Hệ thống trả về event invalid match, system error, match result
function unexpectedDisconnection(socket) {
    socket.on('disconnect', async () => {
        if (!socket.data.matchID) {
            return;
        }
        let match = matches[socket.data.matchID];
        if (!match || !match.playing) {
            return;
        }
        let player1Socket = match.player1;
        let player2Socket = match.player2;
        let matchResult = await handleWinLose(socket.data.matchID, socket.id);
        if (matchResult == 0) {
            if (player1Socket.id != socket.id) {
                player1Socket.emit('invalid match');
                disconnect(player1Socket);
            } else if (player2Socket && player2Socket.id != socket.id) {
                player2Socket.emit('invalid match');
                disconnect(player2Socket);
            }
            return;
        } else if (matchResult == -1) {
            if (player1Socket.id != socket.id) {
                player1Socket.emit('system error');
                disconnect(player1Socket);
            } else if (player2Socket && player2Socket.id != socket.id) {
                player2Socket.emit('system error');
                disconnect(player2Socket);
            }
            return;
        } else if (matchResult == 1) {
            return;
        }
        if (matchResult.player1.socket.id != socket.id) {
            matchResult.player1.socket.emit('match result', {
                score: matchResult.player1.score,
                scoreD: matchResult.player1.scoreD,
                result: matchResult.player1.result,
                newWords: matchResult.player1.newWords
            });
            disconnect(matchResult.player1.socket);
        }
        if (matchResult.player2 && matchResult.player2.socket.id != socket.id) {
            matchResult.player2.socket.emit('match result', {
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

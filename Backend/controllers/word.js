const Word = require('../models/word');
const WordMeaning = require('../models/wordmeaning');
const PartOfSpeech = require('../models/partofspeech');
const cacheClient = require('../services/cache');
const { Op } = require('sequelize');

async function getWordSuggestions(req, res) {
    let qWord = req.query.qWord;
    if (!qWord || qWord.trim() === '') {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    qWord = qWord.trim();
    try {
        let result = await Word.findAll({
            attributes: ['WordV'],
            where: {
                WordV: {
                    [Op.like]: `${qWord}%`
                }
            },
            limit: 10
        });
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy gợi ý từ', error);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function getWordInformation(req, res) {
    let word = req.query.word;
    if (!word || word.trim() === '') {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    word = word.toLowerCase().trim();
    let cachedData = cacheClient.get(`wordInformation:${word}`);
    if (cachedData) {
        return res.status(200).json(cachedData);
    }
    try {
        let popularity = await Word.findOne({
            attributes: ['Popularity'],
            where: { WordV: word }
        });
        if (!popularity) {
            return res.status(404).json({ error: 'Không tìm thấy từ được yêu cầu' });
        }
        let meanings = await WordMeaning.findAll({
            attributes: {
                exclude: ['WMID', 'WordV', 'POSID']
            },
            where: { WordV: word },
            include: {
                model: PartOfSpeech,
                attributes: ['POSName']
            },
            raw: true
        });
        let result = {
            word: word,
            popularity: popularity.Popularity,
            meanings: meanings
        }
        cacheClient.set(`wordInformation:${word}`, result);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy thông tin từ', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getWordSuggestions, getWordInformation }
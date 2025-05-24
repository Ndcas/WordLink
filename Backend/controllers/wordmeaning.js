const WordMeaning = require('../models/wordmeaning');
const cacheClient = require('../services/cache');
const googleAPI = require('../services/googleapi');

async function getPronunciation(req, res) {
    let word = req.body.word;
    let ipa = req.body.ipa;
    if (!word || word.trim() === '' || !ipa || ipa.trim() === '') {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    word = word.toLowerCase().trim();
    ipa = ipa.trim();
    let result = cacheClient.get(`pronunciation:${word}:${ipa}`);
    if (result) {
        return res.status(200).json({
            word: word,
            ipa: ipa,
            pronunciation: result
        });
    }
    try {
        let wordMeaning = await WordMeaning.findOne({
            where: {
                WordV: word,
                Phonetic: ipa
            }
        });
        if (!wordMeaning) {
            return res.status(404).json({ error: 'Không tìm thấy từ với phát âm được yêu cầu' });
        }
        result = await googleAPI.pronounceWord(ipa, word);
        cacheClient.set(`pronunciation:${word}:${ipa}`, result);
        return res.status(200).json({
            word: word,
            ipa: ipa,
            pronunciation: result
        });
    } catch (error) {
        console.log('Lỗi khi lấy phát âm của từ', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function explainPronunciation(req, res) {
    let word = req.body.word;
    let ipa = req.body.ipa;
    if (!word || word.trim() === '' || !ipa || ipa.trim() === '') {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    word = word.toLowerCase().trim();
    ipa = ipa.trim();
    let result = cacheClient.get(`explainedPronunciation:${word}:${ipa}`);
    if (result) {
        return res.status(200).json({
            word: word,
            ipa: ipa,
            explanation: result
        });
    }
    try {
        let wordMeaning = await WordMeaning.findOne({
            where: {
                WordV: word,
                Phonetic: ipa
            }
        });
        if (!wordMeaning) {
            return res.status(404).json({ error: 'Không tìm thấy từ với phát âm được yêu cầu' });
        }
        result = await googleAPI.explainPronunciation(ipa, word);
        cacheClient.set(`explainedPronunciation:${word}:${ipa}`, result);
        return res.status(200).json({
            word: word,
            ipa: ipa,
            explanation: result
        });
    } catch (error) {
        console.log('Lỗi khi lấy giải thích phát âm của từ', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getPronunciation, explainPronunciation }
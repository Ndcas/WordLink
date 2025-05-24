const Word = require('../models/word');
const { Op } = require('sequelize');

async function getWordSuggestions(req, res) {
    let qWord = req.query.qWord;
    if (!qWord || qWord.trim() === '') {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
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

module.exports = { getWordSuggestions }
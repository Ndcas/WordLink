const Bookmark = require('../models/bookmark');

async function getBookmarks(req, res) {
    let AID = req.authorization.AID;
    try {
        let result = await Bookmark.findAll({
            attributes: ['WordV'],
            where: { AID: AID }
        });
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy bookmark', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function newBookmark(req, res) {
    let AID = req.authorization.AID;
    let word = req.body.word;
    try {
        await Bookmark.create({
            AID: AID,
            WordV: word
        });
        return res.status(200).json({ message: 'Tạo bookmark thành công' });
    } catch (error) {
        console.log('Lỗi khi tạo bookmark', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function deleteBookmark(req, res) {
    let AID = req.authorization.AID;
    let word = req.body.word;
    try {
        await Bookmark.destroy({
            where: {
                AID: AID,
                WordV: word
            }
        });
        return res.status(200).json({ message: 'Xóa bookmark thành công' });
    } catch (error) {
        console.log('Lỗi khi xóa bookmark', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getBookmarks, newBookmark, deleteBookmark }
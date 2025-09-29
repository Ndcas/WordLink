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
    let word = req.body.word?.trim();
    if (!word) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
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
    let word = req.body.word?.trim();
    if (!word) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let bookmark = await Bookmark.findOne({
            where: {
                AID: AID,
                WordV: word
            }
        });
        if (bookmark) {
            await bookmark.destroy();
        } else {
            return res.status(404).json({ error: 'Bookmark không tồn tại' });
        }
        return res.status(200).json({ message: 'Xóa bookmark thành công' });
    } catch (error) {
        console.log('Lỗi khi xóa bookmark', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

async function isBookmarked(req, res) {
    let AID = req.authorization.AID;
    let word = req.body.word?.trim();
    if (!word) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào' });
    }
    try {
        let bookmark = await Bookmark.findOne({
            where: {
                AID: AID,
                WordV: word
            }
        });
        return res.status(200).json({
            bookmarked: bookmark ? true : false
        });
    } catch (error) {
        console.log('Lỗi khi kiểm tra bookmark', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getBookmarks, newBookmark, deleteBookmark, isBookmarked };
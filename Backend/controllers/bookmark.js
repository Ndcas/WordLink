const Bookmark = require('../models/bookmark');

async function getBookmarks(req, res) {
    let AID = req.authorization.AID;
    try {
        let result = await Bookmark.findAll({
            where: {
                AID: AID
            }
        });
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy bookmark', error);
        return res.status(500).json({ error: 'Lỗi khi lấy bookmark' });
    }
}

module.exports = { getBookmarks }
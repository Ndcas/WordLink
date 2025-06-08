const AvatarImage = require('../models/avatarimage');

async function getAvatarImageList(req, res) {
    try {
        let result = await AvatarImage.findAll();
        return res.status(200).json(result);
    } catch (error) {
        console.log('Lỗi khi lấy danh sách hình đại diện', error);
        res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getAvatarImageList }
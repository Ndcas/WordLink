const MatchHistory = require('../models/matchhistory');
const Account = require('../models/account');
const AvatarImage = require('../models/avatarimage');
const { Op } = require('sequelize');

async function getMatchHistory(req, res) {
    let AID = req.authorization.AID;
    try {
        let pve = await MatchHistory.findAll({
            attributes: {
                exclude: ['AID1', 'AID2']
            },
            where: {
                AID1: AID,
                AID2: null
            },
            order: [['MTime', 'DESC']],
            limit: 30
        });
        let pvp = await MatchHistory.findAll({
            attributes: {
                exclude: ['AID1', 'AID2']
            },
            where: {
                AID1: AID,
                AID2: {
                    [Op.not]: null
                }
            },
            include: {
                as: 'Player 2',
                model: Account,
                include: {
                    model: AvatarImage,
                    attributes: ['Name']
                },
                attributes: ['Username']
            },
            order: [['MTime', 'DESC']],
            limit: 30
        });
        res.status(200).json({
            pve: pve,
            pvp: pvp
        });
    } catch (error) {
        console.log('Lỗi khi lấy lịch sử đấu', error);
        return res.status(500).json({ error: 'Lỗi hệ thống' });
    }
}

module.exports = { getMatchHistory }
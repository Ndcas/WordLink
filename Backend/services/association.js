const Account = require('../models/account');
const AvatarImage = require('../models/avatarimage');
const Bookmark = require('../models/bookmark');
const MatchHistory = require('../models/matchhistory');
const PartOfSpeech = require('../models/partofspeech');
const Word = require('../models/word');
const WordHistory = require('../models/wordhistory');
const WordMeaning = require('../models/wordmeaning');

function initAssociation() {
    // Quan hệ cho Account
    AvatarImage.hasMany(Account, {
        foreignKey: 'AIID',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    Account.belongsTo(AvatarImage, {
        foreignKey: 'AIID',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    // Quan hệ cho Bookmark
    Account.belongsToMany(Word, {
        through: Bookmark,
        unique: false,
        foreignKey: {
            name: 'AID',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    Word.belongsToMany(Account, {
        through: Bookmark,
        unique: false,
        foreignKey: {
            name: 'WordV',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    // Quan hệ cho MatchHistory
    Account.hasMany(MatchHistory, {
        as: 'Player 1',
        foreignKey: {
            name: 'AID1',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    MatchHistory.belongsTo(Account, {
        as: 'Player 1',
        foreignKey: {
            name: 'AID1',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    Account.hasMany(MatchHistory, {
        as: 'Player 2',
        foreignKey: 'AID2',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    MatchHistory.belongsTo(Account, {
        as: 'Player 2',
        foreignKey: 'AID2',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    // Quan hệ cho WordHistory
    Word.hasMany(WordHistory, {
        foreignKey: {
            name: 'WordV',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    WordHistory.belongsTo(Word, {
        foreignKey: {
            name: 'WordV',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    Account.hasMany(WordHistory, {
        foreignKey: {
            name: 'AID',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    WordHistory.belongsTo(Account, {
        foreignKey: {
            name: 'AID',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    // Quan hệ cho WordMeaning
    Word.hasMany(WordMeaning, {
        foreignKey: {
            name: 'WordV',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    WordMeaning.belongsTo(Word, {
        foreignKey: {
            name: 'WordV',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    PartOfSpeech.hasMany(WordMeaning, {
        foreignKey: {
            name: 'POSID',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });

    WordMeaning.belongsTo(PartOfSpeech, {
        foreignKey: {
            name: 'POSID',
            allowNull: false
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
    });
}

module.exports = initAssociation
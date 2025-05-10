const { DataTypes } = require('sequelize');
const sequelize = require('../services/database');

const WordMeaning = sequelize.define('WordMeaning', {
    WMID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    WordV: {
        type: DataTypes.STRING(30),
        allowNull: false,
        references: {
            model: 'Word',
            key: 'WordV'
        }
    },
    POSID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'PartOfSpeech',
            key: 'POSID'
        }
    },
    Phonetic: {
        type: DataTypes.STRING(50),
    },
    Definition: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    Example: {
        type: DataTypes.STRING(500),
    }
}, {
    tableName: 'WordMeaning',
    timestamps: false,
});

module.exports = WordMeaning;
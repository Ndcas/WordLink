const { DataTypes } = require('sequelize');
const db = require('../services/database');

const WordHistory = db.define('WordHistory', {
    WHID: {
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
    AID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Account',
            key: 'AID'
        }
    },
    UseTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'WordHistory',
    timestamps: false
});

module.exports = WordHistory;
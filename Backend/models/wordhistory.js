const { DataTypes } = require('sequelize');
const sequelize = require('../services/database');

const WordHistory = sequelize.define('WordHistory', {
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
        allowNull: false
    }
}, {
    tableName: 'WordHistory',
    timestamps: false,
});

module.exports = WordHistory;
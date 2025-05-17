const { DataTypes } = require('sequelize');
const db = require('../services/database');

const MatchHistory = db.define('MatchHistory', {
    MID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AID1: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Account',
            key: 'AID'
        }
    },
    AID2: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Account',
            key: 'AID'
        }
    },
    ScoreD: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Result: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    MTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'MatchHistory',
    timestamps: false
});

module.exports = MatchHistory;
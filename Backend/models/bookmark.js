const { DataTypes } = require('sequelize');
const db = require('../services/database');

const Bookmark = db.define('Bookmark', {
    AID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Account',
            key: 'AID'
        },
        primaryKey: true
    },
    WordV: {
        type: DataTypes.STRING(30),
        allowNull: false,
        references: {
            model: 'Word',
            key: 'WordV'
        },
        primaryKey: true
    }
}, {
    tableName: 'Bookmark',
    timestamps: false
});

module.exports = Bookmark;
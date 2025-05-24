const { DataTypes } = require('sequelize');
const db = require('../services/database');

const AvatarImage = db.define('AvatarImage', {
    AIID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING(200),
        allowNull: false
    }
}, {
    tableName: 'AvatarImage',
    timestamps: false
});

module.exports = AvatarImage;
const { DataTypes } = require('sequelize');
const sequelize = require('../services/database');

const PartOfSpeech = sequelize.define('PartOfSpeech', {
    POSID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    POSName: {
        type: DataTypes.STRING(30),
        allowNull: false,
    }
}, {
    tableName: 'PartOfSpeech',
    timestamps: false,
});

module.exports = PartOfSpeech;
const { DataTypes } = require('sequelize');
const sequelize = require('../services/database');

const Word = sequelize.define('Word', {
    WordV: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    Popularity: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
}, {
    tableName: 'Word',
    timestamps: false,
});

module.exports = Word;
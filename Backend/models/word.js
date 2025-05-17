const { DataTypes } = require('sequelize');
const db = require('../services/database');

const Word = db.define('Word', {
    WordV: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    Popularity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            isFloat: true,
            min: 0,
            max: 9
        }
    }
}, {
    tableName: 'Word',
    timestamps: false
});

module.exports = Word;
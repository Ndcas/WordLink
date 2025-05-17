const { DataTypes } = require('sequelize');
const db = require('../services/database');

const Account = db.define('Account', {
    AID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    APassword: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    Role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    Status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    Score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: true,
            min: 0,
        }
    }
}, {
    tableName: 'Account',
    timestamps: false
});

module.exports = Account;
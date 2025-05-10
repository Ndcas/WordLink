const { DataTypes } = require('sequelize');
const sequelize = require('../services/database');

const Account = sequelize.define('Account', {
    AID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Username: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    APassword: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    Email: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            isEmail: true,
        }
    },
    Role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    Status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    Score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'Account',
    timestamps: false,
});

module.exports = Account;
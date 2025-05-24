const { DataTypes } = require('sequelize');
const db = require('../services/database');

const Admin = db.define('Admin', {
    Email: {
        type: DataTypes.STRING(500),
        primaryKey: true,
        validate: {
            isEmail: true,
        }
    },
    APassword: {
        type: DataTypes.STRING(64),
        allowNull: false
    }
}, {
    tableName: 'Admin',
    timestamps: false
});

module.exports = Admin;
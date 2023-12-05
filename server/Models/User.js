const Conversation = require("./Conversation");

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {
        userId: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        userName: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });
    return User;
};
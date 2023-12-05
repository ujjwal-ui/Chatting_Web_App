const db = require("../dbConfig");

module.exports = (sequelize, Sequelize) => {
    const UserInGroups = sequelize.define("UserInGroups", {
        // userIdGroupId: {
        //     type: Sequelize.UUID,
        //     allowNull: false,
        //     defaultValue: Sequelize.UUIDV4,
        //     primaryKey: true
        // }

    });
    return UserInGroups;
}
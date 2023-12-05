module.exports = (sequelize, Sequelize) => {
    const GroupMessage = sequelize.define("GroupMessage", {
        groupMessageId: {
            type: Sequelize.UUID,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        message: {
            type: Sequelize.STRING,
            allowNull: false
        },
        time: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });
    return GroupMessage;
}
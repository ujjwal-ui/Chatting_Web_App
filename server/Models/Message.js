
module.exports = (sequelize, Sequelize) => {
    const Message = sequelize.define("Message", {
        messageId: {
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
    return Message;
}
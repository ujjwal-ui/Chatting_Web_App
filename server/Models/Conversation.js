module.exports = (sequelize, Sequelize) => {
    const Conversation = sequelize.define("Converstion", {
        conversationId: {
            type: Sequelize.UUID,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
    });
    return Conversation;
}
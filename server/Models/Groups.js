module.exports = (sequelize, Sequelize) => {
const ChatGroup = sequelize.define("ChatGroup", {
    groupId: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    groupName: {
        type: Sequelize.STRING,
        allowNull: false
    }
});
return ChatGroup;
}

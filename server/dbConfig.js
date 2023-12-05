const Sequelize = require("sequelize");
const dbUser = "root";
const dbName = "Chat";
const dbPassword = "password";

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: "localhost",
    port : 3306,
    dialect: "mysql"
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// models or tables of the DB:
db.User = require("./Models/User")(sequelize, Sequelize);
db.Conversation = require("./Models/Conversation")(sequelize, Sequelize);
db.Message = require("./Models/Message")(sequelize, Sequelize);
db.Groups = require("./Models/Groups")(sequelize, Sequelize);
db.UserInGroups = require("./Models/UserInGroups")(sequelize, Sequelize);
db.GroupMessage = require("./Models/GroupMessage")(sequelize, Sequelize);
db.GroupAndMessages = require("./Models/GroupAndMessages")(sequelize, Sequelize);
db.UserAndMessages = require("./Models/UserAndMessages")(sequelize, Sequelize);

// modeling of User and Conversation Model:
db.User.hasMany(db.Conversation, {
    foreignKey: 'user_1',
    as: 'User_1'
});
db.Conversation.belongsTo(db.User, {foreignKey: 'user_1'});


db.User.hasMany(db.Conversation, {
    foreignKey: 'user_2',
    as: 'User_2'
});
db.Conversation.belongsTo(db.User, {foreignKey: 'user_2'});


// modeling Message and Conversation Model:
db.User.hasMany(db.Message, {
    foreignKey: 'senderId',
    as: 'SenderId'
});
db.Message.belongsTo(db.User, {foreignKey: 'senderId'});


db.User.hasMany(db.Message, {
    foreignKey: 'receiverId',
    as: "ReceiverId"
});
db.Message.belongsTo(db.User, {foreignKey: 'receiverId'});


db.Conversation.hasMany(db.Message, {
    foreignKey: "conversationId",
    as: 'ConversationId'
});
db.Message.belongsTo(db.Conversation, {foreignKey: 'conversationId'});




// group messages modeling...

db.User.belongsToMany(db.Groups, {through: db.UserInGroups, foreignKey: 'userId', as: 'UserId'});
db.Groups.belongsToMany(db.User, {through: db.UserInGroups, foreignKey: 'groupId', as: 'GroupId'});

db.Groups.belongsToMany(db.GroupMessage, {through: db.GroupAndMessages, foreignKey: 'groupId', as: 'GroupID'});
db.GroupMessage.belongsToMany(db.Groups, {through: db.GroupAndMessages, foreignKey: 'groupMessageId', as: 'GroupMessageId'});

db.User.belongsToMany(db.GroupMessage, {through: db.UserAndMessages, foreignKey: 'userId', as: 'UserID'});
db.GroupMessage.belongsToMany(db.User, {through: db.UserAndMessages, foreignKey: 'groupMessageId', as: 'groupMessageID'});

module.exports = db;
const db = require("../dbConfig");
const {Op, where} = require("sequelize");
const socketInst = require("../index");
const moment = require("moment");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const users = require("../users");

module.exports.getUsers= asyncHandler( async(req, res, next) => {
    const users = await db.User.findAll();
    if(!users)
        throw new ApiError("Users not found..!", 500);

    const response = new ApiResponse("users found successfully..!", 201, [users]);
    res.status(response.statusCode).json(response);
});

module.exports.sendMessage = asyncHandler( async(req, res, next)  => {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;
    const message = req.body.message;

    if(!senderId || !receiverId || !message)
       throw new ApiError("payload is missong some values", 401);
    
        const conversation = await db.Conversation.findOne({
            where: {
            [Op.or]: [ {
                   [Op.and] : [
                        {user_1: senderId},
                        {user_2: receiverId}
                   ],
                }, {
                    [Op.and] : [
                        {user_1: receiverId},
                        {user_2: senderId}
                    ],
                }
            ]
            }
        });

        if(!conversation) {
           const conversationRes = await db.Conversation.create({user_1: senderId, user_2: receiverId});
           if(!conversationRes)
                throw new ApiError("conversation creation failed..!", 500);
            
            const messageRes = await db.Message.create({message: message, time: moment().format('lll'), conversationId: conversationRes.dataValues.conversationId,
                senderId: senderId,
                receiverId: receiverId            
            });

            if(!messageRes)
               throw new ApiError("message is not saved", 500);

            const usr = users.find((user) => user.userId === receiverId);
            if(usr !== undefined)
                socketInst.socketInstance.to(usr.socketId).emit("incoming-message", messageRes);
            
            const response = new ApiResponse("message sent successfully..!", 201, [messageRes]);
            return res.status(response.statusCode).json(response);
        }

        const conversationId = conversation.dataValues.conversationId;
        const messageRes = await db.Message.create({message: message,time: moment().format('lll'), conversationId: conversationId,
            senderId: senderId,
            receiverId: receiverId
        });
        if(!messageRes)
           throw new ApiError("message not sent", 500);

        const usr = users.find((user) => user.userId === receiverId);
        if(usr !== undefined) {
            socketInst.socketInstance.to(usr.socketId).emit("incoming-message", messageRes);
        }

        const response = new ApiResponse("message sent successfully..!", 201, [messageRes]);
        return res.status(response.statusCode).json(response);
});

module.exports.getConversationMessages = async(req, res, next) => {
    const senderId = req.query.senderId;
    const receiverId = req.query.receiverId;
    
    if(!senderId || !receiverId)    
        throw new ApiError("payload fields are missing");

    const conversation = await db.Conversation.findOne({
        where: {
        [Op.or]: [ {
               [Op.and] : [
                    {user_1: senderId},
                    {user_2: receiverId}
               ],
            }, {
                [Op.and] : [
                    {user_1: receiverId},
                    {user_2: senderId}
                ],
            }
        ]
        }
    });
    if(!conversation) {
        const response = new ApiResponse("No messages yet", 200);
        return res.status(response.statusCode).json(response);
    }
    const messages = await db.Message.findAll({ 
        where: {conversationId: conversation.dataValues.conversationId},
        order: [['updatedAt', 'ASC']]
    });
    if(!messages)
        throw new ApiError("Failed to fetch messages.!", 500);
    
    const response = new ApiResponse("fetched messages successfully..!", 200, [messages]);
    res.status(response.statusCode).json(response);
}

module.exports.deleteMessage = async(req, res, next) => {
    const messageId = req.body.messageId;
    if(!messageId)
        throw new ApiError("messageId field is missing..!", 401);

    const deleteMessageRes = await db.Message.destroy({ where: {messageId: messageId} });
    if(!deleteMessageRes)
       throw new ApiError("Failed to delete the message..!", 500);

    const response = new ApiResponse("message deleted successfully..!", 201, [messageId]);
    res.status(response.statusCode).json(response);
}

module.exports.deleteConversation = async(req, res, next) => {
    const conversationId = req.body.conversationId;
    const currentUser = req.body.userId;
    let userToSendSocketEvent = null;

    if(!conversationId)
        throw new ApiError("conversationId is missing..!", 401);

    const conversationMessages = await db.Message.findAll({where: {conversationId: conversationId} });
    userToSendSocketEvent = conversationMessages[0].receiverId === currentUser ? conversationMessages[0].senderId : 
    conversationMessages[0].receiverId;
    
    const messageIds = await conversationMessages.map(message => message.messageId);
    if(!messageIds)
        throw new ApiError("Failed to fetch the conversation messages..!", 500);

    const deletedMessagesRes = await db.Message.destroy({where: {messageId: messageIds}});
    if(!deletedMessagesRes)
        throw new ApiError("Failed to deleted the messages", 500);

    const senderInfo = await db.User.findOne({where: {userId: currentUser}});
    console.log(senderInfo);
    if(!senderInfo)
        throw new ApiError("failed to fetch sender", 500);

    const receiver = users.find(user => user.userId === userToSendSocketEvent);
    if(receiver !== undefined)
        socketInst.socketInstance.to(receiver.socketId).emit("conversation-deleted", {userName: senderInfo.userName, userId: senderInfo.userId});

    const response = new ApiResponse("conversation successfully deleted", 200);
    res.status(response.statusCode).json(response);
}
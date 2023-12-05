const db = require("../dbConfig");
const moment = require("moment");
// const users = require("../index").users;
const socketInst = require("../index");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const users = require("../users");

module.exports.createGroup = asyncHandler( async(req, res, next) => {
    const payload = req.body;
    const groupName = payload.groupName;
    const groupUsers = [...payload.groupUsers];

    if(!payload || !groupName || groupUsers.length === 0)
        throw new ApiError("Payload values are missing...!", 401);

    const createGroupRes = await db.Groups.create({groupName: groupName});
    if(!createGroupRes)
        throw new ApiError("group not created", 417);
    // console.log(createGroupRes);

    const userInGroupRes = db.UserInGroups.bulkCreate(groupUsers.map(userId => ({userId: userId, groupId: createGroupRes.groupId })));  
    if(!userInGroupRes)
        throw new ApiError("group not created..!", 417);


    groupUsers.some((user) => {
        users.forEach((socketUser) => {
            if(socketUser.userId === user && socketUser.userId !== groupUsers[groupUsers.length -1]) {
                socketInst.socketInstance.to(socketUser?.socketId).emit("added-to-group", groupName);
                socketInst.socketInstance.to(socketUser?.socketId).emit("add-groups", createGroupRes);
            }
        });
    });

    const response = new ApiResponse("group create", 201, [createGroupRes], true);
    res.status(response.statusCode).json(response);
});

module.exports.getGroups = async(req, res, next) => {
    const userId = req.query.userId;

    const userInGroups = await db.User.findByPk(userId ,{
        include: [
            {
                model: db.Groups,
                through: {model: db.UserInGroups},
                as: "UserId"
            }
        ]
    });

    res.status(200).json({success: true, groups: userInGroups});
}

module.exports.sendGroupMessage = asyncHandler( async(req, res, next) => {
    const senderId = req.body.senderId;
    const groupId = req.body.groupId;
    const message = req.body.message;
    const senderName = req.body.userName;

    console.log(users);

    if([senderId, groupId, message, senderName].some(field => field === ""))
        throw new ApiError("Missing some payload", 401);

    const sendGroupMessageRes = await db.GroupMessage.create({message: message, time: moment().format('lll')});

    if(!sendGroupMessageRes)
        throw new ApiError("message not saved in the database..!", 500);

    const userGroupMessageRes = await db.GroupAndMessages.create({groupId: groupId, groupMessageId: sendGroupMessageRes.groupMessageId});
    
    if(!userGroupMessageRes)
        throw new ApiError("group and message association failed..!", 500);

    const userAndMessageRes = await db.UserAndMessages.create({userId: senderId, groupMessageId: sendGroupMessageRes.groupMessageId});
    if(!userAndMessageRes)
        throw new ApiError("user and message association failed..!", 500);

    const returnMessageObject = {
        groupId: groupId,
        messageId: sendGroupMessageRes.groupMessageId,
        message: sendGroupMessageRes.message,
        time: sendGroupMessageRes.time,
        sender: {
            userName: senderName,
            userId: senderId
        }
    };

    const groupUsers = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.User,
                through: {model: db.UserInGroups},
                as: "GroupId"
            }
        ]
    });

    if(!groupUsers)
        throw new ApiError("failed to fetch group users..!", 500);

    groupUsers.GroupId.forEach((groupUser) => {
        users.forEach((user) => {
            if(groupUser.userId === user.userId && user.userId !== senderId) {
                socketInst.socketInstance.to(user.socketId).emit("incoming-group-message", returnMessageObject);
                socketInst.socketInstance.to(user.socketId).emit("new-group-message", {
                    groupId: groupId,
                    groupName: groupUsers.groupName
                });
            }
        });
    });

    const response = new ApiResponse("group message sent successfully", 201, [returnMessageObject]);
    res.status(response.statusCode).json(response);
});


module.exports.getGroupMessages = asyncHandler( async(req, res, next) => {
    const groupId = req.body.groupId;
    if(!groupId)
        throw new ApiError("groundId field is missing..!", 401);

    const getGroupMessagesRes = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.GroupMessage,
                through: {model: db.GroupAndMessages},
                as: "GroupID",
                include: [{model: db.User, through: db.UserAndMessages, as: "groupMessageID"}],
            }
        ],
        order: [[{ model: db.GroupMessage, as: "GroupID" }, 'createdAt', 'ASC']]
    });
    if(!getGroupMessagesRes)
        throw new ApiError("Failed to fetched group messages..!, 500");

    const response = new ApiResponse("messages fetched messages..!", 200, [getGroupMessagesRes]);
    res.status(response.statusCode).json(response);
});

module.exports.deleteGroupMessage = asyncHandler(async (req, res, next) => {
    const groupMessageId = req.body.messageId;
    const groupId = req.body.groupId;
    const senderId = req.body.senderId;

    if(!groupMessageId || !groupId || !senderId)
        throw new ApiError("payload fields are missing..!", 401);
    
    const group = await db.Groups.findByPk(groupId);
    const groupMessage = await db.GroupMessage.findByPk(groupMessageId);
  
    if (!group || !groupMessage)
        throw new ApiError("not able to fetch group or groupMessage..!", 500);
  
    // Remove the GroupMessage from the Group
   const deleteAssociationRes = await group.removeGroupID(groupMessage);
   if(!deleteAssociationRes)
        throw new ApiError("Not able to delete the group and groupMessage assiciation..!", 500);

    const deleteGroupeMessageRes = await db.GroupMessage.destroy({where: {groupMessageId: groupMessageId}});
    if(!deleteGroupeMessageRes)
        throw new ApiError("Not able to delete the message", 500);


    const groupUsers = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.User,
                through: {model: db.UserInGroups},
                as: "GroupId"
            }
        ]
    });

    if(groupUsers.GroupId.length === 0)
        throw new ApiError("Not able to fetch the users of the group.!", 500);

    groupUsers.GroupId.forEach((groupUser) => {
        users.forEach((user) => {
            if(groupUser.userId === user.userId && user.userId !== senderId) {
                socketInst.socketInstance.to(user.socketId).emit("incoming-group-message-delete", {messageId: groupMessageId});
            }
        });
    });

    const response = new ApiResponse("message deleted", 201, [{groupMessageId: groupMessageId}])
    res.status(response.statusCode).json(response);
});


module.exports.getGroupMembers = asyncHandler( async(req, res, next) => {
    const groupId = req.query.groupId;
    if(!groupId)
        throw new ApiError("groupId field is missing..!", 401);

    const users = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.User,
                through: {model: db.UserInGroups},
                as: "GroupId"
            }
        ] 
    });
    if(!users)
        throw new ApiError("Not able to fetch the users of the group", 500);

    const response = new ApiResponse("groups found successfully..!", 200, [users]);
    res.status(response.statusCode).json(response);
});


module.exports.deleteGroup = asyncHandler( async(req, res, next) => {
    const groupId = req.body.groupId;

    if(!groupId) 
        throw new ApiError("groupId is missing..!", 417);

    const group = await db.Groups.findByPk(groupId);
    if (!group) 
        throw new ApiError("group not found", 401);

    const userInstances = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.User,
                through: {model: db.UserInGroups},
                as: "GroupId"
            }
        ] 
    });

    if(!userInstances)
        throw new ApiError("users of the group are unable to fetch..!",500);

    const removeUsersFromGroupAssociation = await group.removeGroupId(userInstances.GroupId);
    if(!removeUsersFromGroupAssociation)
        throw new ApiError("unable to delete the user and group association", 500);

    const groupMessages = await db.Groups.findByPk(groupId, {
        include: [
            {
                model: db.GroupMessage,
                through: {model: db.GroupAndMessages},
                as: "GroupID"
            }
        ]
    });

    const messages = groupMessages.GroupID;
    const messageIds = messages.map((message) => message.groupMessageId);
    
    if(messages.length !== 0) {
        const deletedMessagesRes = await db.GroupMessage.destroy({
            where: {
            groupMessageId: messageIds
            },
        });
        if(!deletedMessagesRes)
            throw new ApiError("group messages not deleted", 500);
    }
    const deleteGroupRes = await db.Groups.destroy({where: {groupId: groupId}});
    if(!deleteGroupRes)
        throw new ApiError("group is not deleted from the database", 500);


   const usersOfTheGroup = userInstances.GroupId;
   usersOfTheGroup.some((user) => {
        const socketUser = users.find((socketUser) => socketUser.userId === user.userId);
        if(socketUser !== undefined)
            socketInst.socketInstance.to(socketUser.socketId).emit("group-deleted", groupId);    
   });

    const response = new ApiResponse("group deleted", 201, [{groupId: groupId}]);
    res.status(response.statusCode).json(response);
});
















    // const groupMessageInstances = await db.Groups.findByPk(groupId, {
    //     include: [
    //         {
    //             model: db.GroupMessage,
    //             through: {model: db.GroupAndMessages},
    //             as: "GroupID"
    //         }
    //     ]
    // });

//    const removeGroupMessageAssociation = await group.removeGroupID(groupMessageInstances.GroupID);
//    if(!removeGroupMessageAssociation)
//         return res.status(417).json({success: false, message: "unable to delete the group.!"});
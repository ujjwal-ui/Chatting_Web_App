const express = require("express");
const router = express.Router();
const userController = require("../Controllers/User");


router.get("/users", userController.getUsers);
router.post("/users/send-message", userController.sendMessage);
router.get("/users/conversation/messages", userController.getConversationMessages);
router.post("/users/conversation/delete-message", userController.deleteMessage);
router.post("/users/conversation/delete-conversation", userController.deleteConversation);
//   http://localhost:5000/users/conversation/delete-message

module.exports = router;
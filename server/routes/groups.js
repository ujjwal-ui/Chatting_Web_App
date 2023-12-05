const router = require("express").Router();
const groupController = require("../Controllers/group");

router.post("/create-group", groupController.createGroup);
router.get("/get-groups", groupController.getGroups);
router.post("/send-group-message", groupController.sendGroupMessage);
router.post("/get-group-messages", groupController.getGroupMessages);
router.post("/delete-group-message", groupController.deleteGroupMessage);
router.get("/get-group-members", groupController.getGroupMembers);
router.post("/delete-group", groupController.deleteGroup);

module.exports = router;
const express = require("express");
const router = express.Router();
const authControllers = require("../Controllers/Auth");

router.post("/login", authControllers.postLogin);
router.post("/signup", authControllers.postSignup);

module.exports = router;
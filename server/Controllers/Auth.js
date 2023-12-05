const { where } = require("sequelize");
const db = require("../dbConfig");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

module.exports.postLogin = asyncHandler(async(req, res, next) => {
    const name = req.body.name;
    const password = req.body.password;
    console.log(name, password);
    
    if(!name || !password) 
        res.status(401).json({message: "Name or password is wronge.!"});
    
    const user = await db.User.findOne({where: {userName: name, password: password}});
    console.log(user);
    if(!user)
        throw new ApiError("Wronge username or password", 401);

    const response = new ApiResponse("success", 200, user, true);
    res.status(response.statusCode).json(response);
});

module.exports.postSignup = asyncHandler( async(req, res, next) => {
    const userName = req.body.userName;
    const password = req.body.password;

    if(!userName || !password)
        throw new ApiError("payload fields are misssing..!", 401);

    const user = await db.User.create({userName: userName, password: password});
    if(!user)
        throw new ApiError("User not created", 500);

    const response = new ApiResponse("user created successfully.", 201);
    res.status(response.statusCode).json(response);
});
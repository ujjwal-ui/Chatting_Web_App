const express = require("express");
const app = express();
const db = require("./dbConfig");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const groupRoutes = require("./routes/groups");
const users = require("./users");

const cors=require("cors");
const corsOptions ={
   origin:'http://localhost:3000', 
   credentials:true, 
   optionSuccessStatus:200,
}

const io = require("socket.io")(8080, {
    cors : {
        origin: ['http://localhost:3000']
    }
});


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors(corsOptions));
app.use(authRoutes);
app.use(userRoutes);
app.use(groupRoutes);



app.listen(5000, async() => {
    await db.sequelize.sync();

    io.on("connection", socket => {
        console.log("Socket server running.....");
    
       socket.on("add-user", (payload) => {
            const found = users.find((user) => user.userId === payload);
            if(found === undefined)
                users.push({userId: payload, socketId: socket.id});
            console.log(users);
       });
    
       socket.on("delete-sender-deleted-message", (messageId, receiverId) => {
            const user = users.find((user) => user.userId === receiverId);
            if(user !== undefined)
                socket.to(user.socketId).emit("sender-deleted-message", messageId);
       });
    
       socket.on("disconnect", () => {
            const index = users.findIndex((user) => user.socketId === socket.id);
            if(index > -1) {
                users.splice(index, 1);
            }
            console.log(users, "on disconnect");
       })
    });
});

module.exports.socketInstance = io;

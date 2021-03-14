const express = require("express");
const app = express();
const http = require("http").createServer(app);
const socketio = require("socket.io");
const PORT = 8080;

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    'sql11398320','sql11398320','5Iw6QEW76g',{
  host: 'sql11.freemysqlhosting.net',
  dialect: 'mysql',
  storage: 'sql11398320'
});
const DataTypes = require('sequelize/lib/data-types');
module.exports = sequelize;
global.sequelize = sequelize;


//check db connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
});

//define the table (also create if not exists)
const Users = sequelize.define('Users',
    {
    userNick: {
        type: DataTypes.STRING,
        allowNull: false,
        someUnique: { type: DataTypes.STRING, unique: true },
        primaryKey: true
      },
      auth: {
        type: DataTypes.STRING
      },
      createon: {
        type: DataTypes.DATE
      }
    },
    {
    timestamps: true,
    createdAt: 'createon',
    freezeTableName: true,
    tableName: 'DIM_CHAT_USERS'
    } , {
    // Other model options go here
  });

//init the table model
(async () => {
    await sequelize.sync();       
})() 

//validate user and pwd or create new user if not exists
const findusers = async (name,pwd,socket) => {
        const result = await Users.findAll({
            where: {
                userNick: name
              }
            });
        let res = await JSON.stringify(result, null, 2)
        // console.log(res);
        // console.log('this is pwd ' + pwd)
        // console.log('this is res ' + result[0].auth)
        // console.log('this is check' + result[0].auth !== pwd)
        // console.log('this is name ' + name)
        // console.log('this is userNick' + result[0].userNick)
        // console.log('this is check2' + result[0].userNick == name)

        if(res.length > 0 && result[0].auth == pwd) {
            msg = 'login succesful'
            socket.emit('loginsucces',msg)
        }
        else if (res.length != 0 && result[0].auth !== pwd && result[0].userNick == name) {
            msg = 'Password is incorrect'
            socket.emit('logintochaterr',msg)
        }  
        else {
            console.log(name);

            (async (name,pwd) => {
                await Users.create({ userNick: name, auth: pwd });
                msg = 'new user created succesfully'
                socket.emit('newusercreated',msg)    
            })(name,pwd)    
        }     
};

/////websocket init

//setting up the socket + cors handler
const io = socketio(http, 
    {cors: {   
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            //allowedHeaders: ["sagis"],
            credentials: true
           }
    }
);
//running the http server
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

//html welcome to the back server - not used...
app.get('/', function (req, res) {
    res.send('welcome to the chat backend server');
})

//init ws to all connections and listed to any new connection
io.on('connection', (socket) => { 
    /* socket object may be used to send specific 
    messages to the new connected client */
    console.log('new User Logged');
    socket.emit('connection', 'new is logged in');

    socket.on('userMsgReceived', function(data) {
            console.log('got msg from a user:', data.msg);
            //io makes sure that all sessions to the websocket wil be updated
            io.emit('userMsgReceived',data.msg)
    }); 

    socket.on('logintochat', function(data) {
        findusers(data.name,data.pwd,socket) 
       
    })   

});  




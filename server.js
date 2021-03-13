const express = require("express");
const app = express();
const http = require("http").createServer(app);
const socketio = require("socket.io");
const PORT = 8080;

// var Sequelize = require('sequelize');
//var sequelize = new Sequelize('mysql://sql11.freemysqlhosting.net:3306/sql11398320');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    'sql11398320','sql11398320','5Iw6QEW76g',{
  host: 'sql11.freemysqlhosting.net',
  dialect: 'mysql',
  storage: 'sql11398320'
});
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });




const getSql = 
    async function (obj) {

        switch (obj.type) {
            case 'select':
                break;
            case 'insert':
                break;
            case 'update':
                break;
            default:
                break;
        }  
        const results = await sequelize.query('select userID FROM DIM_CHAT_USERS`', {
                        type: Sequelize.QueryTypes.SELECT
        })
        console.log(JSON.stringify(results, null, 2));
        return results
};



//setting up the socket + cors handler
const io = socketio(http, 
    {cors:{  
                    origin: "http://localhost:3000",
                    methods: ["GET", "POST"],
                    //allowedHeaders: ["sagis"],
                    credentials: true
                }
            }
        );

const STATIC_CHANNELS = ['global_notifications', 'global_chat'];

//running the http server
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

app.get('/', function (req, res) {
    res.send('welcome to the chat backend server');
})

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
    
    socket.on('login', function(data) {
        console.log('log data sent:', data.name);
        console.log('log data sent:', data.pwd);
        //io makes sure that all sessions to the websocket wil be updated
        
        getSql({type:data.type, name: data.name, pwd: data.pwd });
        io.emit('login',data.msg)
});  
});






//const functions = require("firebase-functions");
const express = require("express");
const app = express();
const server = require("http");
const socketio = require("socket.io");
const Sequelize = require('sequelize');


//html welcome to the back server - not used...
app.get('/', function (req, res) {
     res.send('welcome to the chat backend server'); 
})
const http = server.createServer(app);
const PORT = process.env.PORT || 8080;//herruku issue needed the env.PORT
const sequelize = new Sequelize(
    'sql11398320','sql11398320','5Iw6QEW76g',{
  host: 'sql11.freemysqlhosting.net',
  dialect: 'mysql',
  storage: 'sql11398320'
});
//http://www.phpmyadmin.co/sql.php?server=1&db=sql11398320&table=DIM_CHAT_MSG&pos=0
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
const Chatmsg = sequelize.define('chat',
    {
    userNick: {
        type: DataTypes.STRING,
        allowNull: false
      },
      msg: {
        type: DataTypes.STRING
      },
      createon: {
        type: DataTypes.DATE
      },
      avatar: {
        type: DataTypes.STRING
      }
    },
    {
    timestamps: true,
    createdAt: 'createon',
    freezeTableName: true,
    tableName: 'DIM_CHAT_MSG'
    } , {
    // Other model options go here
});
//init the table model
(async () => {
    await sequelize.sync();       
})() 
//validate user and pwd or create new user if not exists
//gotta adda code for deleting rows above 10...
const getmsgs = async (socket) => {
    const result = await Chatmsg.findAll({
            limit : 10,
            order:  [
                ['id', 'DESC']
            ],
        });
    let list = Object.values(result)
    socket.emit('sendlastmsg',list )
};
const insertmsgchat = async (sender,msg,createon,avatar) => {
    await Chatmsg.create({ userNick: sender, msg: msg, createon: createon,avatar: avatar});   
}
//validate user and pwd or create new user if not exists
const findusers = async (name,pwd,socket,userlist) => {
        const result = await Users.findAll({
            where: {
                userNick: name
              }
            });
        let res =  JSON.stringify(result, null, 2)
        
        if (userlist === {} || userlist === [] || userlist === undefined 
            || name === ''
           ) {
            //no double users allowed
            socket.emit('logintochaterr')
        }
        else if(res.length > 2 && result[0].auth == pwd) {
            socket.emit('loginsucces',name)
        }
        else if (res.length > 2 && result[0].auth !== pwd && result[0].userNick == name) {
            socket.emit('logintochaterr')
        }  
        else {
            (async (name,pwd) => {
                await Users.create({ userNick: name, auth: pwd });
                socket.emit('newusercreated',name)    
            })(name,pwd)    
        }     
};
function timeformat () {

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    return (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

}
/////websocket init
//setting up the socket + cors handler
const io = socketio(http, 
    {cors: {   
            //origin: "http://localhost:3000",
            origin: "https://anychat-9b81b.web.app",
            methods: ["GET", "POST"],
            credentials: true
           }
    }
);
//running the http server
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
let userDict = {};//sto0re user name and socker id so i can remove logged out users.
let userDictavatar = {};
//init ws to all connections and listed to any new connection
io.on('connection', (socket) => { 
    /* socket object may be used to send specific 
    messages to the new connected client */
    console.log('new User Logged');
    socket.emit('connection', 'new is logged in');

    socket.on('userMsgReceived', function(data) {
            console.log('got msg from a user:', data.msg);
            //io makes sure that all sessions to the websocket wil be updated
            io.emit('userMsgReceived',data.msg,data.sender,timeformat(),data.avatar)
            insertmsgchat(data.sender,data.msg,timeformat(),data.avatar)
    }); 
    socket.on('logintochat', function(data) {
        let list = Object.keys(userDict);
        findusers(data.name,data.pwd,socket,list)
        console.log(getmsgs(socket) )
        getmsgs(socket)
    }) 
    socket.on('displaylastmsg', function() {
        getmsgs(socket)
    })   
    socket.on('updateuserlist', function(data) {
        //io makes sure that all sessions to the websocket wil be updated
        //update users list for all
        //list = [...userlist.add(data)] //seems the set is causing react front an iter issue
        console.log('update user list')
        userDict[data[0]] = socket.conn.id
        userDictavatar[data[0]] = data[1]
        io.emit('updateuserlistall',userDictavatar/*list*/)
        }); 
    socket.on('disconnect', ()=>{
        console.log(socket.conn.id)
        let newdict = {...userDict};
        let newdictavatar = {...userDictavatar}
        userDict = {};
        userDictavatar = {};
        Object.keys(newdict).forEach((item2,idx2)=>{
            if (newdict[item2] !== socket.conn.id) {
                userDict = {...userDict , [item2]: newdict[item2]}
                userDictavatar = {...userDictavatar, [item2]: newdictavatar[item2]}
                //userDict[item2] = newdict[item2]
               // userDictavatar[item2] = newdictavatar[item2]
            }
        } ) 
        console.log('Got disconnect!');
        //remove from the list of connected
        //io.emit('updateuserlist')
        io.emit('updateuserlistall',userDictavatar/*list*/)
     }); 
});  
  //  res.send('welcome to the chat backend server');
//})

//exports.app = functions.https.onRequest(app);

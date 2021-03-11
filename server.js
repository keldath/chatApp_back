const express = require("express");
const app = express();
const http = require("http").createServer(app);
const socketio = require("socket.io");
const PORT = 8080;
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

    socket.on('event', function(data) {
        console.log('A client sent us this dumb message:', data.message);

    socket.on('userMsgReceived', function(data) {
            console.log('got msg from a user:', data.msg);
            //io makes sure that all sessions to the websocket wil be updated
            io.emit('userMsgReceived',data.msg)
        });    
    });

    
});





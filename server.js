const express = require("express");
const app = express();
const http = require("http").createServer(app);
const socketio = require("socket.io");
const cors = require("cors");
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

io.on('connection', (socket) => { 
    /* socket object may be used to send specific 
    messages to the new connected client */
    console.log('new client connected');
    socket.emit('connection', null);
});

const STATIC_CHANNELS = ['global_notifications', 'global_chat'];

//running the http server
http.listen(PORT, () => {
     console.log(`listening on *:${PORT}`);
});


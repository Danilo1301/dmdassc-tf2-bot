const express = require('express');
const app = express();
const path = require("path");
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require("fs");
const cookieParser = require('cookie-parser');

const TB = require("./TB/TB.js");

const __serverPath = __dirname;

app.use(cookieParser());
app.use(express.static("/public/"));

app.get('/', function(req, res) {
  res.end("ok");
});

server.listen(3000, function() {
  console.log('[WEB] Listening on port 3000...');
  TB.Init()
});

io.on('connection', function (socket) {
  console.log("[SOCKET_SERVER] New connection");
});

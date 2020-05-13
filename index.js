var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
const TB = require("./TB/TB.js");

app.use(bodyParser.json());
app.use(express.urlencoded())
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/public/auth.html`);
});

app.post('/', function(req, res) {
  const password = req.body.password;

  if(password == "1599") {
    res.sendFile(`${__dirname}/public/bot.html`);
  } else {
    res.sendFile(`${__dirname}/public/auth-wrongpass.html`);
  }
});

app.post('/post_items', function(req, res) {
  console.log("Got a post", req.body.length + " items");
  res.end("ok");

  TB.AddItems(req.body);
});

app.get('/test', function(req, res) {
  res.sendFile(`${__dirname}/public/bot.html`);
});

app.get('/status', function(req, res) {
  res.json(TB.Status);
});

http.listen(3000, function() {
  console.log('[WEB] Listening on port 3000...');
  TB.Init()
});

io.on('connection', function (socket) {
  console.log("[SOCKET_SERVER] New connection");

  TB.OnConnection(socket);
});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const TB = require("./TB/TB.js");

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

  socket.on('dhhgg', function (data, callback) {
    var items = [];
    for (var item_id in TB.Data.items) {
      items.push(TB.Data.items[item_id]);
    }

    items = items.sort((a, b) => {
      var val_a = null;
      var val_b = null;
      if(data.t == 0) {
        val_a = a.updated_at || -999999999999999999;
        val_b = b.updated_at || -999999999999999999;
      }
      if(data.t == 1) {
        val_a = a.profit1 ? a.profit1.scrap : null;
        val_b = b.profit1 ? b.profit1.scrap : null;
      }
      if(data.t == 2) {
        val_a = a.profit2 ? a.profit2.scrap : null;
        val_b = b.profit2 ? b.profit2.scrap : null;
      }
      if(data.t == 3) {
        val_a = a.profit3 ? a.profit3.scrap : null;
        val_b = b.profit3 ? b.profit3.scrap : null;
      }
      return val_b - val_a;
    });

    callback({items: items.slice(data.i, data.i+data.m), pages: Math.ceil(items.length / data.m)});
  });
});

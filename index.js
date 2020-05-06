var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const TB = require("./TB/TB.js");

//app.use(cookieParser());
app.use(express.static("/public/"));

app.get('/', function(req, res) {
  res.json(TB.Status);
});

app.get('/test', function(req, res) {
  res.sendFile(`${__dirname}/test.html`);
});

http.listen(3001, function() {
  console.log('[WEB] Listening on port 3001...');
  TB.Init()
});

io.on('connection', function (socket) {
  console.log("[SOCKET_SERVER] New connection");

  socket.on("update_item", (itemid) => {
    TB.ManualUpdateItem(itemid);
  });

  socket.on("get_item_info", (itemid, callback) => {
    callback(TB.Data.items[itemid]);
  });

  socket.on("get_blacklist", (callback) => {
    callback(TB.GetBlackList())
  })

  socket.on("save_blacklist", (value) => {
    var words = value.split(" ");
    while (words.includes(" ")) {
      words.splice(words.indexOf(" "), 1);
    }
    while (words.includes("")) {
      words.splice(words.indexOf(""), 1);
    }
    TB.SetBlackList(words);
  })

  socket.on('items', function (data, callback) {
    //console.log(data);

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

  TB.ListenUpdate("search_item_completed", (item, left) => {
    if(!socket.connected) { return; }
    socket.emit("item_completed", item.id, left);
  });
});

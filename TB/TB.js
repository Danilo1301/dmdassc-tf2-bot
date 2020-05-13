const TBConversor = require("./TBConversor");
const TBUtils = require("./TBUtils");
const TBQuality = require("./TBQuality");
const TBRequest = require("./TBRequest");
const TBStorage = require("./TBStorage");

const TBQuery = require("./TBQuery");
const TBBackpack = require("./TBBackpack");
const TBStn = require("./TBStn");

class TB {
  static Clients = [];
  static Indexed_Items = {};
  static Items = {};
  static Data = {
    settings: {time_between_interval: 60, interval_time: 10, stnitems_updates: 0, max_delay_between_items: 1},
    key_price: {}
  };
  static CustomQuery = [];

  static items_custom_urls = [
    {name: "Unusual Horseless Headless Horsemann's Headtaker", craftable: true, quality: 5, url: "https://backpack.tf/stats/Unusual/Horseless%20Headless%20Horsemann%27s%20Headtaker/Tradable/Craftable"},
    {name: "Gargoyle Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Gargoyle%20Case/Tradable/Craftable"},
    {name: "Creepy Crawly Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Creepy%20Crawly%20Case/Tradable/Craftable"},
    {name: "Infernal Reward War Paint Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Infernal%20Reward%20War%20Paint%20Case/Tradable/Craftable"}
  ];

  static Init() {
    TBBackpack.Data = TBStorage.ReadFile("backpack") || {};
    TBStn.Data = TBStorage.ReadFile("stn") || {};
    this.Data = TBStorage.ReadFile("data") || this.Data;

    var self = this;

    TBBackpack.GetItemInfo("https://backpack.tf/stats/Unique/Mann%20Co.%20Supply%20Crate%20Key/Tradable/Craftable").then((info) => {

      if(info.best_to_sell) {
        self.Data.key_price = info.best_to_sell.price;
      } else if(info.best_to_buy) {
        self.Data.key_price = info.best_to_buy.price;
      }
      TBConversor.SetKeyPrice(self.Data.key_price);

      console.log(`Key price is: ${TBConversor.key.string}`);

      this.InitTimer();
    });
  }

  static AddItems(stn_items) {
    var items = [];

    for (var stn_item of stn_items) {
      var item = {};

      item.full_name = stn_item.real_name;
      item.name = stn_item.name;
      item.craftable = stn_item.craftable;
      item.festive = stn_item.festive;
      item.quality = TBQuality.GetQualityById(stn_item.qualityid);
      item.img = stn_item.icon;

      if(!item.urls) {
        item.urls = {stn: stn_item.href, backpack: ""};
      }

      if(!item.urls.backpack) {
        for (var spreadsheet_item of TBBackpack.Data.items) {
          if(stn_item.craftable == spreadsheet_item.craftable && (stn_item.name.toLowerCase() == spreadsheet_item.name.toLowerCase() || stn_item.name.toLowerCase().replace("the ", "") == spreadsheet_item.name.toLowerCase().replace("the ", ""))) {
            var ur = spreadsheet_item.qualities[item.quality.id];
            if(ur != undefined) {
              item.urls.backpack = "https://backpack.tf" + ur;
            }
            break;
          }
        }
      }

      if(!item.urls.backpack) {
        for (var cu of TB.items_custom_urls) {
          if(cu.name == item.full_name && cu.craftable == item.craftable && cu.quality == item.quality.id) {
            item.urls.backpack = cu.url;
            break;
          }
        }
      }

      items.push(item);

    }

    console.log(`Got ${items.length} items`);

    for (var item of items) {
      item.id = TBUtils.generateRandomKey(20);

      var found_item = null;

      for (var stored_item_id in TB.Items) {
        var stored_item = TB.Items[stored_item_id];
        if(stored_item.full_name == item.full_name && stored_item.craftable == item.craftable && stored_item.quality.id == item.quality.id) {
          found_item = stored_item;
          break;
        }
      }

      if(found_item) {
        //console.log("already added, id " + found_item.id)
      } else {
        TB.Items[item.id] = item;
        //console.log("new, id " + item.id)
      }
    }

    //console.log(items)
  }

  static OnItemCompleted(item) {
    console.log(`${item.id} completed`);
  }

  static InitTimer() {
    var task = {started: null, end: null, completed: true}

    var max_delay_between_items = this.Data.settings.max_delay_between_items * 1000;
    var time_between_interval = this.Data.settings.time_between_interval * 1000;
    var interval_time = this.Data.settings.interval_time * 1000;

    var started_at = Date.now();
    var interval_started_at = null;

    var stnsearch_completed = 0;


    var category_search = {i: 0, page: 1}

    var lastSentData = Date.now();

    setInterval(() => {
      var rnd = Math.random()*2500+800;

      if(Date.now() >= lastSentData + 500) {
        lastSentData = Date.now();

        var items = [];

        for (var k in TB.Items) {
          items.push(TB.Items[k]);
        }


        var items_recent = items.sort((a, b) => {
          return (b.updated_at || -1) - (a.updated_at || -1);
        });

        var items_profit1 = items.sort((a, b) => {
          return (b.profit1 ? b.profit1.scrap : null) - (a.profit1 ? a.profit1.scrap : null);
        });


        for (var socket of this.Clients) {
          if(!socket.connected) { continue; }

          socket.emit("items", items_profit1.slice(0, 10));
          //socket.emit("items", items_recent);
        }
      }

      if(Date.now() >= started_at + time_between_interval && task.started == null) {
        if(interval_started_at == null) {
          interval_started_at = Date.now();
          console.log(`[interval] ${(interval_started_at + interval_time) - Date.now()} left`);
        }

        if(Date.now() >= interval_started_at + interval_time) {
          console.log("[interval] Over");
          started_at = Date.now();
          interval_started_at = null;
          stnsearch_completed = 0;
        }
      }



      if(task.started == null) {
        if(this.CustomQuery.length > 0) {
          task.started = Date.now();
          task.end = task.started + max_delay_between_items;
          task.completed = false;

          var item = this.CustomQuery.splice(0, 1);

          console.log(`QUERY (${rnd}) [${item}]`);

          setTimeout(()=> { task.completed = true; }, rnd);
        } else {
          if(interval_started_at == null) {

            if(false) {
              if(Math.ceil((Date.now() - started_at)/(time_between_interval / this.Data.settings.stnitems_updates)) != stnsearch_completed) {
                stnsearch_completed += 1

                task.started = Date.now();
                task.end = task.started + max_delay_between_items;
                task.completed = false;

                console.log(`PAGE ${TBStn.categories[category_search.i]} ${category_search.page}`);

                category_search.page += 1;

                TBStn.GetItemsInPage(TBStn.categories[category_search.i], category_search.page).then((page_items)=>{
                  if(page_items.length == 0) {
                    category_search.i += 1;
                    category_search.page = 1;

                    if(category_search.i >= TBStn.categories.length-1) {
                      category_search.i = 0;
                    }
                  }
                  console.log(page_items.length, category_search)

                  TB.ProcessItems(page_items).then((items) => {
                    console.log(`Got ${items.length} items`);


                    for (var item of items) {
                      item.id = TBUtils.generateRandomKey(20);

                      var found_item = null;

                      for (var stored_item_id in TB.Items) {
                        var stored_item = TB.Items[stored_item_id];
                        if(stored_item.full_name == item.full_name && stored_item.craftable == item.craftable && stored_item.quality.id == item.quality.id) {
                          found_item = stored_item;
                          break;
                        }
                      }

                      if(found_item) {
                        //console.log("already added, id " + found_item.id)
                      } else {
                        TB.Items[item.id] = item;
                        //console.log("new, id " + item.id)
                      }



                    }


                    task.completed = true;

                  })

                  //task.completed = true;
                  //stnsearch_completed += 1
                });
              }
            }


            task.started = Date.now();
            task.end = task.started + max_delay_between_items;
            task.completed = false;

            var n = 0;

            var to_update = [];
            for (var item_id in this.Items) {
              var item = this.Items[item_id];

              if(!item.updated_at || Date.now() - item.updated_at > 10*60*1000) {
                to_update.push(item);
              }

              n++;
            }

            var item = to_update[Math.round(Math.random()*(to_update.length-1))];

            if(item) {
              if(item.urls.backpack == "") {
                console.log(`No url`)
                task.completed = true;
              } else {

                console.log(`ITEM (${item.id}) [${rnd}] (${to_update.length} / ${n} avalible)`);

                TBQuery.SearchItem(item).then(() => {
                  task.completed = true;
                  TB.OnItemCompleted(item);
                })
              }

            } else {
              console.log(`No items`)
              task.completed = true;
            }

          }
        }



      }

      if(Date.now() >= task.end && task.completed) {
        task.started = null;
        task.end = null;
      }



    }, 25);
  }

  static GetItemsInformation() {
    var self = this;
    return new Promise(function(resolve) {



      TBBackpack.GetSpreadsheet().then((spreadsheet) => {
        TBBackpack.Data.items = spreadsheet;
        TBBackpack.Data.lastUpdated = Date.now();

        TBStorage.StoreInFile("backpack", TBBackpack.Data);



        TBStn.on("getitems_progress", (info) => {


          info.categories = [TBStn.categories.indexOf(info.category)+1, TBStn.categories.length];

        })

        TBStn.GetItems().then((stn_items) => {
          console.log(`Got ${stn_items.length} items from ${TBStn.categories.length} categories`);

          TBStn.Data.items = stn_items;
          TBStn.Data.lastUpdated = Date.now();

          TBStorage.StoreInFile("stn", TBStn.Data);
          console.log(TBStn.Data);

          resolve();
        })


      })

    });
  }

  static ProcessItems(stn_items) {
    return new Promise(function(resolve) {
      var items = [];

      for (var stn_item of stn_items) {

        var item = {};

        item.full_name = stn_item.full_name;
        item.name = stn_item.name;
        item.craftable = stn_item.craftable;
        item.quality = TBQuality.GetQualityById(stn_item.quality);
        item.img = stn_item.img;

        if(!item.urls) {
          item.urls = {stn: "https://stntrading.eu" + stn_item.href, backpack: ""};
        }

        if(!item.urls.backpack) {
          for (var spreadsheet_item of TBBackpack.Data.items) {
            if(stn_item.craftable == spreadsheet_item.craftable && (stn_item.name.toLowerCase() == spreadsheet_item.name.toLowerCase() || stn_item.name.toLowerCase().replace("the ", "") == spreadsheet_item.name.toLowerCase().replace("the ", ""))) {
              var ur = spreadsheet_item.qualities[item.quality.id];
              if(ur != undefined) {
                item.urls.backpack = "https://backpack.tf" + ur;
              }
              break;
            }
          }
        }

        if(!item.urls.backpack) {
          for (var cu of TB.items_custom_urls) {
            if(cu.name == item.full_name && cu.craftable == item.craftable && cu.quality == item.quality.id) {
              item.urls.backpack = cu.url;
              break;
            }
          }
        }


        items.push(item);
      }

      resolve(items);
    });
  }

  static OldProcessItems() {
    console.log(`TBStn.Data.items: ${TBStn.Data.items.length}\nTBBackpack.Data.items: ${TBBackpack.Data.items.length}`)


    var items = TBStn.Data.items;

    TB.Data.items = TB.Data.items || {};

    //--
    var n = 0;

    for (var item of items) {
      var found_item = null;

      for (var k in TB.Data.items) {
        if(TB.Data.items[k].full_name == item.full_name && TB.Data.items[k].craftable == item.craftable && TB.Data.items[k].quality.id == item.quality) {
          found_item = TB.Data.items[k];
          break;
        }
      }

      var id = TBUtils.generateRandomKey(20);

      if(found_item) {
        id = found_item.id;
      } else {
        TB.Data.items[id] = {id: id};
      }

      TB.Data.items[id].full_name = item.full_name;
      TB.Data.items[id].name = item.name;
      TB.Data.items[id].craftable = item.craftable;
      TB.Data.items[id].quality = TBQuality.GetQualityById(item.quality);
      TB.Data.items[id].img = item.img;

      n++;

      if(!TB.Data.items[id].urls) {
        TB.Data.items[id].urls = {stn: "https://stntrading.eu" + item.href, backpack: ""};
      }

      if(!TB.Data.items[id].urls.backpack) {
        for (var spreadsheet_item of TBBackpack.Data.items) {
          if(item.craftable == spreadsheet_item.craftable && (item.name.toLowerCase() == spreadsheet_item.name.toLowerCase() || item.name.toLowerCase().replace("the ", "") == spreadsheet_item.name.toLowerCase().replace("the ", ""))) {
            var ur = spreadsheet_item.qualities[TB.Data.items[id].quality.id];
            if(ur != undefined) {
              TB.Data.items[id].urls.backpack = "https://backpack.tf" + ur;
            }
            break;
          }
        }
      }

      if(!TB.Data.items[id].urls.backpack) {
        for (var cu of this.items_custom_urls) {
          if(cu.name == TB.Data.items[id].full_name && cu.craftable == TB.Data.items[id].craftable && cu.quality == TB.Data.items[id].quality.id) {
            TB.Data.items[id].urls.backpack = cu.url;
            break;
          }
        }
      }
    }

    console.log(`Total of ${n} items`)
    //--



    TBQuery.on("search_item_begin", (item) => {
      //console.log("begin ", item)

      this.Status.info.current_item = item;
    });

    TBQuery.on("search_item_completed", (item, left)=> {
      //console.log("search_item_completed", left, item.full_name)

      TB.Data.items[item.id] = item;
      this.Status.info.estimated_time = TBQuery.estimated_time;

      //console.log(TBQuery.estimated_time)

      if(TBQuery.items_completed % 5 == 0) {
        console.log("Saving..")
        TBStorage.StoreInFile("data", TB.Data);
      }
    })

    TBQuery.on("search_ended", ()=> {
      console.log("Query finished. Waiting 30 minutes to start another!")
      setTimeout(()=> {
        TB.AddRandomItemsToQuery();
      }, 30*1000*60)

    });

    this.AddRandomItemsToQuery();
  }

  static AddRandomItemsToQuery()
  {

    var random_items = [];

    for (var id in TB.Data.items) { random_items.push(TB.Data.items[id]); }

    while (random_items.length > 0) {
      TBQuery.AddItem(random_items.splice(Math.round(Math.random()*(random_items.length-1)), 1)[0]);
    }
    console.log(`Starting queue with ${TBQuery.query.length} items`);


    return console.log("Dont start");

    TBQuery.SearchNext();
  }



  static OnConnection(socket) {
    this.Clients.push(socket)
  }
}

module.exports = TB;

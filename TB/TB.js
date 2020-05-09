const TBConversor = require("./TBConversor");
const TBUtils = require("./TBUtils");
const TBQuality = require("./TBQuality");
const TBRequest = require("./TBRequest");
const TBStorage = require("./TBStorage");

const TBQuery = require("./TBQuery");
const TBBackpack = require("./TBBackpack");
const TBStn = require("./TBStn");

class TB {
  static updateTime = 99999999*1000*60*60*24 //*0

  static Data = {items: {}};

  static Status = {
    code: 0
  }

  static items_custom_urls = [
    {name: "Unusual Horseless Headless Horsemann's Headtaker", craftable: true, quality: 5, url: "https://backpack.tf/stats/Unusual/Horseless%20Headless%20Horsemann%27s%20Headtaker/Tradable/Craftable"},
    {name: "Gargoyle Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Gargoyle%20Case/Tradable/Craftable"},
    {name: "Creepy Crawly Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Creepy%20Crawly%20Case/Tradable/Craftable"},
    {name: "Infernal Reward War Paint Case", craftable: true, quality: 6, url: "https://backpack.tf/stats/Unique/Infernal%20Reward%20War%20Paint%20Case/Tradable/Craftable"}
  ];

  static Init() {
    TBBackpack.Data = TBStorage.ReadFile("backpack") || {};
    TBStn.Data = TBStorage.ReadFile("stn") || {};
    this.Data = TBStorage.ReadFile("data") || {};

    var self = this;

    TBBackpack.GetItemInfo("https://backpack.tf/stats/Unique/Mann%20Co.%20Supply%20Crate%20Key/Tradable/Craftable").then((info) => {

      if(info.best_to_sell) {
        self.Data.key_price = info.best_to_sell.price;
      }
      TBConversor.SetKeyPrice(self.Data.key_price);

      console.log(`Key price is: ${TBConversor.key.string}`);

      if(!TBStn.Data.lastUpdated || Date.now() - TBStn.Data.lastUpdated >= this.updateTime) {
        return this.GetItemsInformation().then(this.ProcessItems.bind(this));
      }

      this.ProcessItems();
    });
  }

  static GetItemsInformation() {
    var self = this;
    return new Promise(function(resolve) {

      self.Status.code = 1;

      TBBackpack.GetSpreadsheet().then((spreadsheet) => {
        TBBackpack.Data.items = spreadsheet;
        TBBackpack.Data.lastUpdated = Date.now();

        TBStorage.StoreInFile("backpack", TBBackpack.Data);

        self.Status.code = 2;

        TBStn.on("getitems_progress", (info) => {
          self.Status.code = 3;

          info.categories = [TBStn.categories.indexOf(info.category)+1, TBStn.categories.length];

          self.Status.info = info;


          console.log(info);
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

  static ProcessItems() {
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

      if(TBQuery.items_completed % 30 == 0) {
        console.log("Saving..")
        TBStorage.StoreInFile("data", TB.Data);
      }
    })

    TBQuery.on("search_ended", ()=> {
      TB.AddRandomItemsToQuery();
    });

    this.AddRandomItemsToQuery();
  }

  static AddRandomItemsToQuery()
  {
    this.Status.code = 5;
    this.Status.info = {estimated_time: null, current_item: null};

    console.log(this.Status.info)

    var random_items = [];

    for (var id in TB.Data.items) { random_items.push(TB.Data.items[id]); }

    while (random_items.length > 0) {
      TBQuery.AddItem(random_items.splice(Math.round(Math.random()*(random_items.length-1)), 1)[0]);
    }
    console.log(`Starting queue with ${TBQuery.query.length} items`);

    //return console.log("Dont start")

    TBQuery.SearchNext();
  }

  static ListenUpdate(e, fn) {
    TBQuery.on(e, fn);
  }

  static GetBlackList() {
    return TBBackpack.offer_blacklist_words;
  }

  static SetBlackList(words) {
    return TBBackpack.offer_blacklist_words = words;
  }

  static ManualUpdateItem(itemid) {
    TBQuery.toAdd_query.push(TB.Data.items[itemid]);
  }
}

module.exports = TB;

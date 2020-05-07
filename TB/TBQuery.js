const TBRequest = require("./TBRequest");
const TBEvents = require("./TBEvents");
const TBConversor = require("./TBConversor");
const TBUtils = require("./TBUtils");

const TBStn = require("./TBStn");
const TBBackpack = require("./TBBackpack");

class TBQuery {
  static query = [];

  static toAdd_query = [];

  static events = new TBEvents();

  static on = this.events.Setup();

  static items_completed = 0;

  static query_itemStartedAt = null;
  static query_times = [];
  static estimated_time = null;

  static AddItem(item) {
    //console.log(`Adding to query`)
    this.query.push(item);
  }

  static SearchNext() {
    if(this.toAdd_query.length != 0) {
      while (this.toAdd_query.length > 0) {
        console.log(`Adding 1 new item to query`)
        this.query.unshift( this.toAdd_query.pop() );
      }
    }

    var self = this;
    var item = this.query[0];



    if(!item) {
      this.events.TriggerEvent("search_ended");
      return console.log("no items");
    }

    //console.log(item);

    if(item.urls.backpack == "") {
      self.query.shift();
      return self.SearchNext();
    }

    self.events.TriggerEvent("search_item_begin", [item]);

    self.query_itemStartedAt = Date.now();



    item.price = {};

    var ps = [];

    //console.log(`[query] ${this.query.length} items left`);

    //console.log(` Query ${this.query.length} items left`);
    //console.log(item)
    //console.log("\n")

    ps.push(TBStn.GetItemInfo(item.urls.stn));
    ps.push(TBBackpack.GetItemInfo(item.urls.backpack));

    Promise.all(ps).then(function(values) {
      var info_stn = values[0];
      var info_backpack = values[1];

      item.marketplace_price = info_backpack.price_marketplace;

      item.price.stn = {};
      item.price.backpack = {};

      item.max_stock = info_stn.max_stock;
      item.stock = info_stn.stock;

      item.price.stn.buy = info_stn.price_buy;
      item.price.stn.sell = info_stn.price_sell;

      item.price.backpack.buy = info_backpack.best_to_buy ? info_backpack.best_to_buy.price : null;
      item.price.backpack.sell = info_backpack.best_to_sell ? info_backpack.best_to_sell.price : null;

      if(item.price.backpack.sell && item.price.stn.buy) {
        item.profit1 = TBConversor.Convert(item.price.backpack.sell.scrap - item.price.stn.buy.scrap);
      } else {
        item.profit1 = null;
      }

      if(item.price.stn.sell && item.price.backpack.buy) {
        item.profit2 = TBConversor.Convert(item.price.stn.sell.scrap - item.price.backpack.buy.scrap);
      } else {
        item.profit2 = null;
      }

      if(item.price.backpack.sell && item.price.stn.sell) {
        item.profit3 = TBConversor.Convert(item.price.stn.sell.scrap - item.price.backpack.sell.scrap);
      } else {
        item.profit3 = null;
      }

      item.updated_at = Date.now();

      self.query.shift();
      self.items_completed++;

      self.events.TriggerEvent("search_item_completed", [item, self.query.length]);

      self.query_times.push(Date.now() - self.query_itemStartedAt);

      if(self.query_times.length > 12) {
        self.query_times.splice(0, 1);
      }

      var s = 0;
      for (var t of self.query_times) {
        s += t;
      }
      self.estimated_time = (s / self.query_times.length)*self.query.length;


      setTimeout(()=> {
        self.SearchNext();
        console.log("Search next item")
      },1000)


    }).catch((e)=> {
      console.log("ERROR", e)
    });


  }
}

module.exports = TBQuery;

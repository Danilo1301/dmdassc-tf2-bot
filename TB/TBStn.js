const TBUtils = require("./TBUtils");
const TBRequest = require("./TBRequest");
const TBConversor = require("./TBConversor");
const TBEvents = require("./TBEvents");

class TBStn {
  static categories = ["tf2-items", "tf2-hats", "tf2-stranges", "tf2-weapons", "tf2-vintages", "tf2-genuines"];

  static events = new TBEvents();
  static on = this.events.Setup();

  static GetItems() {
    var self = this;
    var items = [];

    return new Promise(function(resolve, reject) {
      var n = 0;
      (function loop(i) {
        if(i >= self.categories.length) {
          return resolve(items);
        }

        self.BrowsePagesOfCategory(self.categories[i]).then((category_items)=> {
          items = items.concat(category_items);
          loop.bind(self, i+1)();
        })
      })(n);

    });
  }

  static BrowsePagesOfCategory(category)
  {
    var items = [];
    var self = this;
    var page = 1;
    var items_got = null;

    return new Promise(function(resolve) {
      (function loop(i) {
        if(items_got == 0) { return resolve(items); }

        new Promise((reslv) => {
          self.GetItemsInPage(category, i).then((page_items)=>{
            items_got = page_items.length;

            items = items.concat(page_items);


            self.events.TriggerEvent("getitems_progress", [{items: items.length, category: category, page: i}]);

            console.log("getitems_progress")

            setTimeout(() => { reslv(); }, 1000);

          });

        }).then(loop.bind(self, i+1));
      })(page);
    });



    return;


  }

  static GetItemsInPage(category, page)
  {
    var colors_quality = {"#FFD700": 6, "#CF6A32": 11, "#830000": 14, "#4D7455": 1, "#38F3AB": 13, "#476291": 3, "#8650AC": 5};
    var self = this;
    return new Promise(function(resolve, reject) {
      TBRequest.GetBody(`https://stntrading.eu/backend/itemOverviewAjax?query=0&page=${page}&category=${category}&sort=1`).then((body)=>{
        var items = [];
        var items_html = TBUtils.splitStringSegments(JSON.parse(TBUtils.decodeEntities(body)).html, "<div class='search-res-item-wrap'>", "</div></div></a></div>");

        for(var h of items_html)
        {
          var info = {};
          info.full_name = TBUtils.splitStringSegments(h, "<span class='item-name'>", "</span>", true);

          info.name = info.full_name;

          info.craftable = info.full_name.indexOf("Non-Craftable") == -1;

          if(!info.craftable) {
            info.name = info.name.replace("Non-Craftable ", "");
          }

          var n = h.indexOf("border-color:");
          info.quality = colors_quality[h.slice(n, h.indexOf(";", n)).split(" ")[1]];

          info.img = TBUtils.splitStringSegments(h, "<img src='", "' ></img>", true);
          info.href = TBUtils.splitStringSegments(h, "<div class='search-res-item-wrap'><a href='", "'><div class='search-res-item", true);

          if(info.quality == 11) {
            info.name = info.name.replace("Strange ", "");
          }
          if(info.quality == 1) {
            info.name = info.name.replace("Genuine ", "");
          }
          if(info.quality == 3) {
            info.name = info.name.replace("Vintage ", "");
          }
          if(info.quality == 5) {
            info.name = info.name.replace("Unusual ", "");
          }

          items.push(info);
        }

        resolve(items);
      })
    });
  }

  static GetItemInfo(url)
  {
    var self = this;
    return new Promise(function(resolve) {
      TBRequest.GetBody(url).then((body)=>{
        var info = {};

        var n = body.indexOf('<div class="stl-bx my-2">');
        var s = body.slice(n, body.indexOf('<div class="col-md-6 col-lg-7 col-xl-8">', n));
        var es = TBUtils.getElementsInString(s);
        var stock = parseInt(es[3].split("<")[0]);
        var max_stock = parseInt(es[5].split("<")[0]);


        var n = body.indexOf('<div class="col-md-6 col-lg-7 col-xl-8">');
        var s = body.slice(n, body.indexOf('</div></div>', n));

        var lastn = 0;

        var price_sell = null;
        var price_buy = null;

        while ((lastn = body.indexOf('<a class="tfip-pg-bx-wrap shadow-sm" onclick="', lastn)) != -1) {
          var n = body.indexOf("</a>", lastn);
          var s = body.slice(lastn, n+4);
          var es = TBUtils.getElementsInString(s);

          var val = es[5].split("for ")[1].split("<")[0];

          if(s.indexOf("Sell for") != -1) { price_sell = val; }

          if(s.indexOf("Buy from") != -1 && s.indexOf("Killstreak") == -1) { price_buy = val; }

          lastn = n;
        }

        if(price_buy) { price_buy = TBConversor.Convert(price_buy); }
        if(price_sell) { price_sell = TBConversor.Convert(price_sell); }

        info.price_buy = price_buy;
        info.price_sell = price_sell;
        info.stock = stock;
        info.max_stock = max_stock;

        resolve(info);


      });

    });
  }
}

module.exports = TBStn;

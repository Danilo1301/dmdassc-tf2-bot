const TBRequest = require("./TBRequest");
const TBConversor = require("./TBConversor");
const TBUtils = require("./TBUtils");

class TBBackpack {
  static offer_blacklist_words = ["airborne", "enemies", "lvl", "level", "halloween", "painted", "spectral", "spectrum", "part", "spell", "voices", "below", "footprints", "lime", "pink", "black", "white", "orange", "light green", "purple", "gold", "team spirit", "after eight", "value of teamwork"];

  static GetItemInfo(url)
  {
    var self = this;
    return new Promise(function(resolve) {
      TBRequest.GetBody(url).then((body)=>{

        var info = {price_marketplace: null, buy_offers: [], sell_offers: [], best_to_buy: null, best_to_sell: null}

        var n = body.indexOf("</ul>", body.indexOf("<ul class='media-list'>"))+5;
        var sl_sell_orders = body.slice( body.indexOf("<ul class='media-list'>"), n);

        var n = body.indexOf("<ul class='media-list'>", n);
        var sl_buy_orders = body.slice(n, body.indexOf("</ul>", n));

        var price_mp = body.indexOf('<a class="price-box" href="https://marketplace.tf')
        var price_mp_s = body.slice(price_mp, body.indexOf("</a>", price_mp))
        info.price_marketplace = parseFloat(price_mp_s.slice(price_mp_s.indexOf("$")+1, price_mp_s.indexOf("</div>", price_mp_s.indexOf("$")))).toFixed(2);

        var offers = self.GetOffers(sl_buy_orders).concat(self.GetOffers(sl_sell_orders));

        info.sell_offers = [];
        info.buy_offers = [];

        for (var offer of offers) {
          if(offer.intent == "buy") {
            info.sell_offers.push(offer);
          } else {
            info.buy_offers.push(offer);
          }
        }

        // Options
				// ignoreOld: true,
				// ignorePaint: false,
				// ignoreNoQuote: true,
				// minutesLimit: 60,
				// ignoreCraft: false,
				// ignoreParts: false,
				// blockBlacklist: true,
				// *not_used* ignoreAll: false

        info.best_to_sell = self.GetBestOffer(info.sell_offers, {
          ignoreOld: true,
  				ignorePaint: true,
  				ignoreNoQuote: true,
  				minutesLimit: 60,
  				ignoreCraft: true,
  				ignoreParts: true,
  				blockBlacklist: true
        });

        info.best_to_buy = self.GetBestOffer(info.buy_offers, {
          ignoreOld: true,
  				ignoreNoQuote: true,
  				minutesLimit: 60
        });

        resolve(info);

      });
    });
  }

  static GetOffers(or) {
    var offers = [];
    var lastn = 0;
    while ((lastn = or.indexOf("<li class='listing ' id=", lastn)) != -1) {
      var n = or.indexOf("</li>", lastn);
      var s = or.slice(lastn, n+5);

      var offer = {};

      offer.intent = TBUtils.findAttribute(s, 'data-listing_intent');
      offer.price = TBConversor.Convert( TBUtils.findAttribute(s, 'data-listing_price') );
      offer.comment = s.indexOf("data-listing_comment") != -1 ? TBUtils.findAttribute(s, 'data-listing_comment') : "";
      offer.paint = s.indexOf("data-paint_name") != -1 ? TBUtils.findAttribute(s, 'data-paint_name') : "";
      offer.datetime = new Date(TBUtils.findAttribute(s, 'datetime', true)).getTime();
      offer.time = Date.now() - offer.datetime;
      offer.isCraft = s.indexOf("<div class='tag top-left'>") != -1;
      offer.hasParts = s.indexOf("Parts Attached") != -1;

      var user = s.indexOf("<a class='user-link");
      var user_s = s.slice(user, s.indexOf("</a>", user))
      offer.user_name = TBUtils.findAttribute(user_s, 'data-name');
      offer.online = TBUtils.findAttribute(user_s, 'data-online') == "1";

      offers.push(offer);

      lastn = n;
    }
    return offers;
  }

  static GetBestOffer(offers, options) {
    var best;

    for (var offer of offers) {

      var hasBlacklistedWordInQuote = false

			for (var word of this.offer_blacklist_words) {
				if(offer.comment.toLowerCase().indexOf(word.toLowerCase()) != -1) {
					hasBlacklistedWordInQuote = true;
					break;
				}
			}

      if(options.ignoreOld && offer.time > 1000*60*options.minutesLimit) { continue; }
      if(options.ignoreNoQuote && offer.comment == "") { continue; }
      if(options.blockBlacklist && hasBlacklistedWordInQuote) { continue; }
      if(options.ignorePaint && offer.paint != "") { continue; }
      if(options.ignoreCraft && offer.isCraft) { continue; }
      if(options.ignorePaint && offer.hasParts) { continue; }

      if(!best) {
        best = offer;
      }
    }
    return best;
  }


  static GetSpreadsheet()
  {
    var colors_quality = {"#FFD700": 6, "#CF6A32": 11, "#830000": 14, "#4D7455": 1, "#38F3AB": 13, "#476291": 3};
    var self = this;
    var total_items = [];

    return new Promise(function(resolve) {
      TBRequest.GetBody(`https://backpack.tf/spreadsheet`).then((body)=>{
        var table = body.slice(body.indexOf('<tbody>')+7, body.indexOf('</tbody>'));

        var el_items = TBUtils.splitStringSegments(table, "<tr data-craftable='", "</tr>");

        for (var ei of el_items) {
          var item = {};

          var elements = TBUtils.getElementsInString(ei);
          item.name = elements[2].split("<")[0];
          item.craftable = elements[0].split("'")[1] == "1";
          item.qualities = {};

          if(item.name.endsWith(" ")) {
            item.name = item.name.slice(0, item.name.length-1);
          }

          for (var e of elements) {
            if(e.indexOf("<td abbr=") != -1 && e.indexOf("style") != -1) {
              var color = e.slice(e.indexOf(": ")+2, e.indexOf(";"));
              item.qualities[colors_quality[color]] =  elements[elements.indexOf(e)+1].split("'")[3];
            }
          }

          total_items.push(item);
        }
        resolve(total_items);
      });
    });
  }
}

module.exports = TBBackpack;

class TBConversor {
  static key;

  static SetKeyPrice(price) {
    this.key = price;
  }

  static Convert(e) {
    var price = {scrap: null, string: null};

    if(typeof e == "number") {
      price.scrap = e;
      price.string = this.ConvertScrapToString(e);
    } else {
      price.scrap = this.ConvertStringToScrap(e);
      price.string = this.ConvertScrapToString(price.scrap);
    }

    return price;
  };

  static ConvertStringToScrap(str) {
    var scraps = 0;

    var key_part = null;
    var ref_part = null;

    if(str.includes("key")) {
      key_part = str.split(",")[0].split(" ")[0];
      if(str.includes("ref")) {
        str = str.split(", ")[1];
      }
      if(this.key != undefined) {
        scraps += Math.round(parseFloat(key_part)*this.key.scrap);
      }
    }
    if(str.includes("ref")) {
      ref_part = str.split(" ")[0];
      scraps += parseInt(ref_part.split(".")[0])*3*3;
      if(ref_part.includes(".")) {
        scraps += Math.round(parseInt(ref_part.split(".")[1])/11);
      }
    }
    return scraps;
  }

  static ConvertScrapToString(scraps) {
    var v = {k: 0, rf: 0, rc: 0, s: 0};
    var neg = false;

    if(scraps < 0) {
      neg = true;
      scraps = Math.abs(scraps);
    }

    if(this.key != undefined) {
      v.k += Math.floor(scraps/this.key.scrap);
      scraps -= v.k*this.key.scrap;
    }

    if(scraps/9 >= 1) {
      v.rf += Math.floor(scraps/9);
      scraps -= v.rf*9;
    }

    if(scraps/3 >= 1) {
      v.rc += Math.floor(scraps/3);
      scraps -= v.rc*3;
    }

    v.s = scraps;

    var str = neg ? "-" : "";
    if(v.k > 0) {
      str += `${v.k} key${v.k > 1 ? "s" : ""}`;
    }

    var rf = v.rf;
    var rf_s = v.rc*3+v.s;

    if(rf > 0 || rf_s > 0) {
      if(v.k > 0) { str += ", "; }
      str += `${rf}${rf_s > 0 ? `.${rf_s*11}` : ``} ref`;
    }
    return str;
  }
}

module.exports = TBConversor;

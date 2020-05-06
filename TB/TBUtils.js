class TBUtils {
  static findAttribute(str, attr, onlyOneB) {
    var sm = onlyOneB ? "'" : '"';
    var find = `${attr}=${sm}`;
    var n = str.indexOf(find)+find.length;
    return str.slice(n, str.indexOf(sm, n))
  }

  static splitStringSegments(text, from, to, onlyInside) {
    var el = [];
    var str = text;
    while (str.indexOf(from) != -1) {
        var seg = str.slice(str.indexOf(from), str.indexOf(to) + to.length);
        el.push(onlyInside ? (seg.replace(from, "").replace(to, "")) : seg);
        str = str.replace(seg, "");
    }
    return el.length == 1 ? el[0] : el;
  }

  static getElementsInString(str) {
    var parts = [];
    while (str.indexOf("<") != -1) {
      var sl = str.slice(0, str.indexOf(">")+1);
      str = str.replace(sl, "");
      sl = sl.replace(/\n/g, '');
      sl = sl.replace(/  /g, '');
      parts.push(sl);
    }
    return parts;
  }

  static decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\'",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
  }

  static generateRandomKey(length) {
     var result           = '';
     var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     var charactersLength = characters.length;
     for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
  }

  static millisecondsToHuman(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);

    const humanized = [
      this.pad(hours.toString(), 2),
      this.pad(minutes.toString(), 2),
      this.pad(seconds.toString(), 2),
    ].join(':');

    return humanized;
  }

  static pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

}

module.exports = TBUtils;

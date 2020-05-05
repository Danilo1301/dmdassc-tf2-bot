class TBQuality {
  static qualities = {};

  static Init() {
    this.CreateQuality(6, "Unique");
    this.CreateQuality(11, "Strange");
    this.CreateQuality(3, "Vintage");
    this.CreateQuality(1, "Genuine");
    this.CreateQuality(5, "Unusual");
    this.CreateQuality(13, "Haunted");
    this.CreateQuality(14, "Collector");
  }

  static CreateQuality(id, name) {
    this.qualities[id] = new ItemQuality(id, name);
  }

  static GetQualityByName(name) {
    for (var id in this.qualities) {
      var ql = this.qualities[id];
      if(ql.name.toLowerCase() == name.toLowerCase()) { return ql; }
    }
  }

  static GetQualityById(id) {
    return this.qualities[id];
  }
}

class ItemQuality {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

TBQuality.Init();

module.exports = TBQuality;

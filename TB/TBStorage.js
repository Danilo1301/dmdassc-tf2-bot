const fs = require("fs");

const data_path = "data/"

class TBStorage {
  static ReadFile(file)
  {
    var file_path = data_path + file + ".json";

    if(!fs.existsSync(data_path)) {
      fs.mkdirSync(data_path);
    }

    if(!fs.existsSync(file_path)) {
      return;
    }

    return JSON.parse(fs.readFileSync(file_path, "utf8"));
  }

  static StoreInFile(file, data)
  {
    var file_path = data_path + file + ".json";
    fs.writeFileSync(file_path, JSON.stringify(data));
  }
}

module.exports = TBStorage;

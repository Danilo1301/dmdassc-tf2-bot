const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const TBQuality = require("./TBQuality");
const TBConversor = require("./TBConversor");

const fs = require("fs");

const https = require('https');

class TBRequest {
  static GetBody(url) {
    var self = this;
    return new Promise(function(resolve) {

      https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
      });

      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
      
    });
  }


  static OldGetBody(url) {
    var self = this;
    return new Promise(function(resolve) {
      const tryFetch = function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader("Content-type", "text/plain; charset=UTF-8");
        xhr.send(null);
        xhr.onload = function () { resolve(xhr.responseText); }
        xhr.onerror = function () {
          console.log(`XML ERROR at (${url})`);
          console.log(`Retrying in 5 seconds...`);
          setTimeout(()=> { tryFetch() }, 5000)
        }
      };
      tryFetch();
    });
  }
};

module.exports = TBRequest;

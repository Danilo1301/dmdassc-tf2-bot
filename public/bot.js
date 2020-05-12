const model = `
<li class="item list-group-item d-flex justify-content-between align-items-center list-group-item-action list-group-item-light">
  <img data-type="image" src="" class="rounded float-left" width="45" height="45">
  <div class="col">
    <div class="row">
      <div>
        <div class="col" data-type="name" style="color: black">...</div>
        <div class="col" data-type="profits"></div>
      </div>
    </div>
  </div>
  <small class="badge badge-dark badge-pill" data-type="time">...</small>
</li>
`;

const addProfitBadge = (el, price, amount, color) => {
  el.find(`[data-type="profits"]`).append(`<small class="badge badge-pill mr-1" style="color: black; background: ${color}">${price}</small>`)
  el.find(`[data-type="profits"]`).append(`<small class="badge badge-pill mr-3" style="color: black; background: ${color}">${amount}</small>`)
}

const qualities = {
  "6": ["#e2c10a", "#ffd700c9"],
  "11": ["#bb551c", "#CF6A32"],
  "5": ["#8650ac", "#8650acd4"],
};

const socket = io();

socket.on("items", (items) => {
  var ids = [];

  for (var item of items) {
    ids.push(item.id)
  }

  $(".item").toArray().forEach((item, i) => {

    if(!ids.includes($(item).attr("item-id")) || i != ids.indexOf($(item).attr("item-id"))) {
      $(item).remove();
    }
  });



  for (var item of items) {

    var find = $(`[item-id="${item.id}"]`);

    if(find.length != 0) {
      if(find.attr("updated-at") != (item.updated_at || "0")) {
        find.remove();
      } else {
        continue;
      }

    }

    var index = items.indexOf(item);
    var element = $(model);
    element.attr("item-id", item.id);
    element.attr("updated-at", item.updated_at || "0");

    if(qualities[item.quality.id]) {
      var colors = qualities[item.quality.id];
      element.css("background-color", colors[1]);
      element.find(`[data-type="image"]`).css("background-color", colors[0]);
    }


    element.find(`[data-type="name"]`).text(item.name);
    element.find(`[data-type="image"]`).attr("src", item.img);

    if(item.updated_at) {
      var t = new Date(item.updated_at).toString().split(" ")[4].split(":")
      t = `${t[0]}:${t[1]}:${t[2]}`;

      element.find(`[data-type="time"]`).text(t);
    } else {
      element.find(`[data-type="time"]`).hide();
    }


    element.show();
    element.css("opacity", 1);

    console.log(item)

    if(item.profit1) {
      if(item.profit1.scrap > 0) {
        addProfitBadge(element, item.profit1.string, item.stock, "#12d40d");
      }

    }
    if(item.profit2) {
      if(item.profit2.scrap > 0) {
        addProfitBadge(element, item.profit2.string, item.max_stock - item.stock, "#d8b203");
      }
    }
    if(item.profit3) {
      if(item.profit3.scrap > 0) {
        addProfitBadge(element, item.profit3.string, item.max_stock - item.stock, "#a9a9a9");
      }
    }



    if(index == 0) {
      $("#items_list").prepend(element);
    } else {
      $(element).insertAfter($(".item").get(index-1))
    }


  }

});



//addProfitBadge(element, "12.55 ref", 2, "#12d40d");

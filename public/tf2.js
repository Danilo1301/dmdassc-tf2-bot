const socket = io();

let search = {start_from: 0, items_for_page: 7, pages: 0};

const item_html = `
<div class="item media text-muted pt-3 border-bottom border-gray" style="opacity: 0; transition: opacity 0.5s;">
  <img style="margin-left: 15px; background: gray; border: solid black 2px;" class="bd-placeholder-img mr-2 rounded" width="40" height="40">
  <p class="media-body pb-3 mb-0 small lh-125" style="position: relative;">
    <strong class="d-block text-gray-dark item-name">ITEM_NAME</strong>
    <span style="position: absolute; right: 10px; top: 0px; display: grid; text-align: end;">
      <span class="time">UPDATED_AT</span>
      <span class="item-id">ITEM_ID</span>
    </span>
    <span style="opacity: 0">.</span>
  </p>
</div>`;

let listItems = [];
let addedItems = [];

let items_elements = [];

const quality_colors = {
  "6": ["#f7e600", "#d8cb15"],
  "1": ["#4d7455", "#305036"],
  "11": ["#cf6a32", "#925331"],
  "5": ["#8650ac", "#68398a"],
  "3": ["#476291", "#364867"]
}

$("#toggle-options-tab").click(()=> {
  $("#options-tab").show();
  $("#options-tab").css("opacity", "1");
  $("#options-tab").css("top", "0px");

  $("#edit-blacklist").show();
  $("#collapse_blacklist").removeClass("show")
})

$("#options-tab #close").click(()=> {
  if($("#collapse_blacklist").hasClass("show")) {
    socket.emit("save_blacklist", $("#exampleFormControlTextarea1").val());
  }

  $("#options-tab").css("opacity", "0");
  $("#options-tab").css("top", "-500px");
  getItems();
  setTimeout(()=> { $("#options-tab").hide(); }, 500);
})

$("#refresh").click(()=> {
  getItems();
})

$("#voltar").click(()=>{
  $("#item-info").hide();
  $("#items").show();
  $("#options").show();
})

$(".refresh-item").click(()=>{
  $(".refresh-item").prop("disabled", true)
  $(".update-info").text("Atualizando, aguarde...");

  socket.emit("update_item", $(".refresh-item").attr("target-item"));
})

$("#edit-blacklist").click(()=> {
  $("#exampleFormControlTextarea1").val("Carregando lista...");
  $("#exampleFormControlTextarea1").prop("disabled", true)
  $("#edit-blacklist").hide();


  socket.emit("get_blacklist", function(words) {
    //console.log("Got", words)

    var val = "";
    for (var w of words) {
      val += w + " ";
    }


    $("#exampleFormControlTextarea1").val(val);
    $("#exampleFormControlTextarea1").prop("disabled", false);
    //$("#edit-blacklist").prop("disabled", true);
    //$("#edit-blacklist").text("Salvar");
  })
})

function applyInfoToElement(e, item) {


  e.attr("item-id", item.id);
  e.find(".item-name").text(item.full_name)
  e.find(".item-name").css("color", quality_colors[item.quality.id][1])
  e.find(".item-id").text("#" + item.id)

  e.find(".time").text(item.updated_at != null ? msToTime(Date.now() - item.updated_at) + " atrás" : "");

  e.find("img").attr("src", item.img)
  e.find("img").css("border-color", quality_colors[item.quality.id][1])
  e.find("img").css("border-style", item.craftable ? "solid" : "dashed")
  e.find("img").css("background-color", quality_colors[item.quality.id][0])

  e.attr("onclick", "showitem('"+listItems.indexOf(item)+"')");

  e.find(".badge").remove();

  if(item.profit1) {
    if(item.profit1.scrap > 0) {
      addProfitTag(e, "#33b333", item.profit1.string, item.stock);
    }
  }

  if(item.profit2) {
    if(item.profit2.scrap > 0) {
      addProfitTag(e, "#a1a216", item.profit2.string, item.max_stock - item.stock);
    }
  }

  if(item.profit3) {
    if(item.profit3.scrap > 0) {
      addProfitTag(e, "#a9a9a9", item.profit3.string, item.max_stock - item.stock);
    }
  }

  e.show();
  e.css("opacity", item.updated_at != undefined ? 1 : 0.5);
}

$(document).ready(function() {

  setInterval(()=> {

    for (var i = 0; i < listItems.length; i++) {
      var item = listItems[i];
      item.pos = listItems.indexOf(item);

      var el;
      if((el = $("#item_"+i))[0] != undefined) {
        if(el.attr("item-id") != item.id) {
          //applyInfoToElement(el, item);
        }
        applyInfoToElement(el, item);
        //console.log(el.attr("item-id"), item.id)
        continue;
      }

      var it = $(item_html);

      it.attr("id", "item_"+i)




      $("#items-list").append(it);

      applyInfoToElement(it, item);

    }

  }, 100)

  getItems();
});

function getItems() {
  var t = parseInt($("#exampleFormControlSelect1").val());


  socket.emit("items", {t: t, s: "asc", i: search.start_from, m: search.items_for_page}, function(e) {
    //console.log(e.items)
    listItems = e.items;
    search.pages = e.pages;

    $("#page-info").text(`Página ${(search.start_from/search.items_for_page)+1} / ${search.pages}`);
  })
}

function prevpage() {
  if(search.start_from <= 0) { return; }
  search.start_from -= search.items_for_page;
  getItems()
}

function nextpage() {
  if((search.start_from/search.items_for_page)+1 >= search.pages) { return; }
  search.start_from += search.items_for_page;
  getItems()
}

function openwdn(url) {
  window.open(url);
}

function showitem(id) {
  var item = listItems[id];

  //console.log(item)

  if(!item.updated_at) {
    return alert("Este item ainda não foi atualizado!");
  }

  var e = $("#item-info");

  $(".refresh-item").attr("target-item", item.id);
  $(".refresh-item").prop("disabled", false)


  $(".update-info").text("Ultima vez atualizado: " + new Date(item.updated_at).toString().split(" ")[4]);

  e.show();
  $("#items").hide();
  $("#options").hide();

  e.find(".name").text(item.full_name);
  e.find("img").attr("src", item.img);
  e.find("img").css("background-color", "white");
  e.find(".display").css("background-color", quality_colors[item.quality.id][0]);

  e.find(".stock").text(item.stock);
  e.find(".max-stock").text(item.max_stock);

  e.find(".stn-buy").text(item.price.stn.buy ? item.price.stn.buy.string : "?")
  e.find(".stn-sell").text(item.price.stn.sell ? item.price.stn.sell.string : "?")
  e.find(".stn-btn").attr("onclick", "openwdn('"+item.urls.stn+"')")

  e.find(".bp-buy").text(item.price.backpack.buy ? item.price.backpack.buy.string : "?")
  e.find(".bp-sell").text(item.price.backpack.sell ? item.price.backpack.sell.string : "?")
  e.find(".bp-btn").attr("onclick", "openwdn('"+item.urls.backpack+"')")

  e.find(".profit1").text(item.profit1 ? item.profit1.string : "?")
  e.find(".profit2").text(item.profit2 ? item.profit2.string : "?")
  e.find(".profit3").text(item.profit3 ? item.profit3.string : "?")

  e.find(".percent").css("width", `${Math.round(item.stock/item.max_stock*100)}%`);
}

socket.on("item_completed", function(itemid, left) {
  //console.log(`Item #${itemid} updated (${left} left)`);
  $(".items-maintext").text(`Itens (${left} na fila)`)

  var found = null;

  for (var it of listItems) {
    if(it.id == itemid) { found = it; break;}
  }

  if(found) {
    //console.log('found')
    socket.emit("get_item_info", itemid, function(item) {
      listItems[found.pos] = item;
      applyInfoToElement($(`.item#item_${found.pos}`), item);

      if($("#item-info").css("display") == "block" && $(`button[target-item='${item.id}']`)[0] != undefined) {
        //console.log(found.pos)
        //console.log(listItems[found.pos])
        showitem(found.pos);
        //alert("Atualizado com sucesso!")
      }


    });
  }

  return;

  var e;

  if((e = $(".item[item-id='"+itemid+"'"))[0]) {
    console.log(e)
    socket.emit("get_item_info", itemid, function(item) {
      console.log("info", item);
    });
  }



  return;

  var found = null;

  for (var it of listItems) {
    if(it.id == item.id) { found = it; break;}
  }

  if(found != null) {
    console.log(item.id + " updated!")
    if($("#item-info").css("display") == "block" && $(`button[target-item='${item.id}']`)[0] != undefined) {
      showitem(listItems.indexOf(it));
      alert("Atualizado com sucesso!")
    }
  }
})


function msToTime(ms) {
	var result = "0 segundos", seconds = 0, minutes = 0, hours = 0, days=0;

	if(ms/1000 >= 0) {
		seconds = Math.round(ms/1000)
	}
	if(seconds/60 >= 0) {
		minutes = Math.round(seconds/60)
	}
	if(minutes/60 >= 0) {
		hours = Math.round(minutes/60)
	}
	if(hours/24 >= 0) {
		days = Math.round(hours/24)
	}

	if(days>0) {
		result = `${days} dia${days>1?"s":""}`
	} else if(hours>0) {
		result = `${hours} hora${hours>1?"s":""}`
	} else if(minutes>0) {
		result = `${minutes} minuto${minutes>1?"s":""}`
	} else if(seconds>0) {
		result = `${seconds} segundo${seconds>1?"s":""}`
	}
	return result
};

function addProfitTag(e, color, price, amount)
{
  e.find("p").append(`<span class="badge" style="color: white; background-color: ${color}; margin-right: 5px;">${price}</span>`);
  e.find("p").append(`<span class="badge" style="color: white; background-color: ${color}; margin-right: 10px;">${amount}</span>`);
}

// TODO: make a Random module.
// TODO: label axes.
// TODO: axes should automatically set ranges.

var args = [];
args.verbose = false;
args.minVolume = 1;
args.maxVolume = 2;
args.volIncrements = 100;
args.minPrice = 9095;
args.maxPrice = 9105
args.maxPriceImprovement = 2;
args.minStartingOrders = 10;
args.maxMessages = 100;
args.maxDelay = 3000;
args.orderBorder = 0;

function OrderBook() {
  this.bids = [];  // [queue, ...]
  this.asks = [];  // [queue, ...]
}
OrderBook.prototype.hasQueue = function(price, side) {
  if (side == 'bid') {
    var idx = this.bids.findIndex(function(x) {
      return x.price == price;
    });
    return idx >= 0;
  } else if (side == 'ask') {
    var idx = this.asks.findIndex(function(x) {
      return x.price == price;
    });
    return idx >= 0;
  }
};
OrderBook.prototype.getQueueIndex = function(price, side) {
  if (side == 'bid') {
    var idx = this.bids.findIndex(function(x) {
      return x.price == price;
    });
  } else if (side == 'ask') {
    var idx = this.asks.findIndex(function(x) {
      return x.price == price;
    });
  }
  return idx;
};
OrderBook.prototype.update = function(order) {
  // Update the book from a new order.
  if (order.type == "add")
    this.addOrder(order);
  else if (order.type == "del")
    this.deleteOrder(order);
  else if (order.type == "mkt")
    this.executeOrder(order);
  // Sort the queues
  this.bids.sort(function(a,b) {
    return b.price - a.price;
  });
  this.asks.sort(function(a,b) {
    return a.price - b.price;
  });
};
OrderBook.prototype.addOrder = function(order) {
  if (order.side == 'bid') {
    if ( this.hasQueue(order.price, order.side) ) {
      var idx = this.getQueueIndex(order.price, order.side);
      this.bids[idx].orders.push(order);
      if (args.verbose) console.log("order added to back of queue");
    } else {
      // start a new queue at order.price
      this.bids.push(new Queue(order.price, order));
      if (args.verbose) console.log("order added to new queue");
    }
  } else if (order.side == 'ask') {
    if ( this.hasQueue(order.price, order.side) ) {
      var idx = this.getQueueIndex(order.price, order.side);
      this.asks[idx].orders.push(order);
      if (args.verbose) console.log("order added to back of queue");
    } else {
      this.asks.push(new Queue(order.price, order));
      if (args.verbose) console.log("order added to new queue");
    }
  }
};
OrderBook.prototype.deleteOrder = function(order) {
  queue_idx = this.getQueueIndex(order.price, order.side);
  if (queue_idx > -1) {
    if (order.side == 'bid') {
      order_idx = this.bids[queue_idx].orders.findIndex(function(x) {
        return x == order.ref;
      });
      this.bids[queue_idx].orders.splice(order_idx, 1);
      if (args.verbose) console.log("order deleted");
      if (this.bids[queue_idx].orders.length == 0) {
        this.bids.splice(queue_idx, 1);
        if (args.verbose) console.log("queue deleted");
      }
    } else if (order.side == 'ask') {
      order_idx = this.asks[queue_idx].orders.findIndex(function(x) {
        return x == order.ref;
      });
      this.asks[queue_idx].orders.splice(order_idx, 1);
      if (args.verbose) console.log("order deleted");
      if (this.asks[queue_idx].orders.length == 0) {
        this.asks.splice(queue_idx, 1);
        if (args.verbose) console.log("queue deleted");
      }
    }
  } else
      console.log("WARNING: order could not be found");
};
OrderBook.prototype.executeOrder = function(order) {
  if (order.side == 'bid' && this.asks.length > 0) {
    var matched = this.asks[0].orders[0];
    if (order.vol < matched.vol) {
      this.asks[0].orders[0].vol -= order.vol;
      if (args.verbose) console.log("executed " + order.vol + " shares.");
    } else {
      order.vol -= this.asks[0].orders[0].vol;
      if (args.verbose) console.log("executed " + this.asks[0].orders[0].vol + " shares.");
      this.asks[0].orders.splice(0, 1);
      if (this.asks[0].orders.length == 0) {
        this.asks.splice(0,1);
      }
      if (order.vol == 0)
        if (args.verbose) console.log("order was executed");
      else if (this.asks.length == 0)
        if (args.verbose) console.log("order was partially executed");
      else
        return this.executeOrder(order);
    }
  } else if (order.side == 'ask' && this.bids.length > 0) {
    var matched = this.bids[0].orders[0];
    if (order.vol < matched.vol) {
      this.bids[0].orders[0].vol -= order.vol;
      if (args.verbose) console.log("executed " + order.vol + " shares.");
    } else {
      order.vol -= this.bids[0].orders[0].vol;
      if (args.verbose) console.log("executed " + this.bids[0].orders[0].vol + " shares.");
      this.bids[0].orders.splice(0, 1);
      if (this.bids[0].orders.length == 0) {
        this.bids.splice(0,1);
      }
      if (order.vol == 0)
        if (args.verbose) console.log("order was executed");
      else if (this.bids.length == 0)
        if (args.verbose) console.log("order was partially executed");
      else
        return this.executeOrder(order);
    }
  } else
      if (args.verbose) console.log("no orders available for execution");
};
OrderBook.prototype.bestAskPrice = function(order) {
  if (this.asks.length > 0)
    return this.asks[0].price;
  else
    return null;
}
OrderBook.prototype.bestBidPrice = function (order) {
  if (this.bids.length > 0)
    return this.bids[0].price;
  else
    return null;
};

function Order(type, side, price, vol, ref) {
  this.type = type;
  this.side = side;
  this.price = price;
  this.vol = vol;
  this.ref = ref;
}

function Queue(price, order) {
  this.price = price;  // e.g. price
  this.orders = [order];  // e.g. order or volume
}

function range(a, b) {
  var out = [];
  for (var i = a; i < b; i += 1) {
    out.push(i);
  }
  return out;
}

function createElementWithClass(name, className, id) {
  var element = document.createElement(name);
  if (className) element.className = className;
  if (id) element.id = id;
  return element;
}

var orderPixels = 25;
var sharePixels = 0.25;
function Display(parent, book) {

  this.status = "inactive";
  this.width = orderPixels * 10;  // 10 cents wide
  this.height = sharePixels * 1000;  // 1000 shares tall
  this.book = book;

  this.yaxis = parent.appendChild(createElementWithClass("div"));
  this.yaxis.style.height = this.height + "px";

  this.wrap = parent.appendChild(createElementWithClass("div", "book-" + this.status));
  this.wrap.style.height = this.height + "px";

  this.xaxis = parent.appendChild(createElementWithClass("div"));

  // this.messageWindow = parent.appendChild(createElementWithClass("div", "messageWindow"))
  // this.buttonPanel = parent.appendChild(createElementWithClass("div", "buttonPanel"))
  // this.pauseButton = this.buttonPanel.appendChild(createElementWithClass("button", "pause"))
  // this.pauseButton.appendChild(document.createTextNode("Pause"));
  // this.playButton = this.buttonPanel.appendChild(createElementWithClass("button", "play"))
  // this.playButton.appendChild(document.createTextNode("Play"));

  this.bookLayer = null;
}
Display.prototype.init = function() {
  console.log("Initializing display...");
  this.status = "active";
  this.minPrice = (book.bids[book.bids.length - 1].price - 5);
  this.maxPrice = (book.asks[book.asks.length - 1].price + 5);
  this.maxVol = 1000;
  this.hLines = this.maxVol / 100;
  this.vLines = (this.maxPrice - this.minPrice) / 1;

  this.width = orderPixels * this.vLines;
  this.wrap.style.width = this.width + "px";
  this.xaxis.style.width = this.width + "px";

  this.wrap.appendChild(this.drawBackground());
  this.drawAxes();
  this.bookLayer = null;
  this.drawFrame();
}
Display.prototype.drawBackground = function() {
  if (args.verbose) console.log("drawBackground called.");
  var table = createElementWithClass("table", "background");
  for (var i = 0; i < this.hLines; i++) {
    var row = table.appendChild(createElementWithClass("tr"));
    for (var j = 0; j < this.vLines; j++) {
      var col = row.appendChild(createElementWithClass("td", "cell"));
    }
  }
  return table;
}
Display.prototype.drawAxes = function () {
  var yTable = this.yaxis.appendChild(createElementWithClass("table", "yaxis"));
  for (var i = 0; i < this.hLines; i++) {
    var row = yTable.appendChild(createElementWithClass("tr"));
    var col = row.appendChild(createElementWithClass("td", "ylabel"));
    col.textContent = (this.hLines * 100) - (i + 1) * 100;
  }
  var xTable = this.xaxis.appendChild(createElementWithClass("table", "xaxis"));
  xTable.style.width = this.width + "px";
  var row = xTable.appendChild(createElementWithClass("tr"));
  for (var j = 0; j < this.vLines; j++) {
    var col = row.appendChild(createElementWithClass("td", "xlabel"));
    if ((j + 1) % 2 == 0) {
      var price = (this.minPrice / 100 + j * 0.01)
      col.textContent = price.toPrecision(4);
    }
  }
};
Display.prototype.drawBook = function() {
  if (args.verbose) console.log("drawBook called.");
  var wrap = createElementWithClass("div", "orders");
  for (var i = 0; i < this.book.bids.length; i++) {
    var queue = this.book.bids[i];
    var left = (queue.price - this.minPrice) * orderPixels;
    var volume = 0;
    for (var j = 0; j < queue.orders.length; j++) {
      var order = queue.orders[j];
      var rect = wrap.appendChild(createElementWithClass("div", "bid", order.ref));
      rect.style.height = order.vol * sharePixels - args.orderBorder + "px";
      rect.style.left = left + "px";
      rect.style.top = - (volume + order.vol) * sharePixels + "px";
      volume += order.vol;
    }
  }
  for (var i = 0; i < this.book.asks.length; i++) {
    var queue = this.book.asks[i];
    var left = (queue.price - this.minPrice) * orderPixels;
    var volume = 0;
    for (var j = 0; j < queue.orders.length; j++) {
      var order = queue.orders[j];
      var rect = wrap.appendChild(createElementWithClass("div", "ask", order.ref));
      rect.style.height = order.vol * sharePixels - args.orderBorder + "px";
      rect.style.left = left + "px";
      rect.style.top = - (volume + order.vol) * sharePixels + "px";
      volume += order.vol;
    }
  }
  return wrap;
}
Display.prototype.drawFrame = function() {
  if (args.verbose) console.log("drawFrame called.");
  if (this.bookLayer)
    this.wrap.removeChild(this.bookLayer);
  this.bookLayer = this.wrap.appendChild(this.drawBook());
  this.wrap.className = "book-" + (this.status || "inactive");
};

// Simulation Methods
function randomInt(low, high, inclusive = false) {
  if (inclusive)
    return low + Math.floor( Math.random() * (high + 1 - low));
  else
    return low + Math.floor( Math.random() * (high - low));
}
function sample(array) {
  index = Math.floor(array.length * Math.random());
  return array[index];
}
function randomType() {
  var x = Math.random();
  if (x < 0.45)
    return 'add';
  else if (x > 0.45 && x < 0.90)
    return 'del';
  else if (x > 0.90)
    return 'mkt';
}
function randomSide() {
  var x = Math.random();
  if (x > 0.5)
    return 'bid';
  else
    return 'ask';
}
function randomVol() {
  return randomInt(args.minVolume, args.maxVolume, inclusive=true) * args.volIncrements;
}
function randomPrc(book, side) {
  if (side == 'bid') {
    var minPrice = args.minPrice;
    if (book.asks.length > 0 )  // check there are still ask orders in the book
      var maxPrice = book.bestAskPrice();
    else {
      if (book.bids.length > 0)  // check there are still bid orders in the book
        var maxPrice = book.bestBidPrice() + args.maxPriceImprovement;
      else
        var maxPrice = Math.floor( (args.minPrice + args.maxPrice) / 2);
    }
    return randomInt(minPrice, maxPrice);
  } else if (side == 'ask') {
    var maxPrice = args.maxPrice;
    if (book.bids.length > 0 )  // check there are still ask orders in the book
      var minPrice = book.bestBidPrice() + 1;
    else {
      if (book.asks.length > 0)  // check there are still bid orders in the book
        var minPrice = book.bestAskPrice() - args.maxPriceImprovement;
      else
        var minPrice = Math.ceil( (args.minPrice + args.maxPrice) / 2);
    }
    return randomInt(minPrice, maxPrice);
  } else {
    console.log("ERROR: invalid `side` argument for method `randomPrc`.");
  }
}
function randomRef() {
  return Math.floor(100000 * Math.random());
}
function randomOrder(book, type) {
  var order = new Order();
  // Assign order type
  if (type == 'add') {
    order.type = 'add';
  } else if (type == 'mkt') {
    order.type = 'mkt';
  } else if (type == 'del') {
    order.type = 'del';
  } else {
    order.type = randomType();
  }
  // Assign order parameters
  if (order.type == 'add') {
    order.side = randomSide();
    order.vol = randomVol();
    order.price = randomPrc(book, order.side);
    order.ref = randomRef();
  } else if (order.type == 'del') {
    order.side = randomSide();
    if (order.side == 'bid') {
      if (book.bids.length > 0) {
        var queue = sample(book.bids);
        var bid = sample(queue.orders);
        order.price = bid.price;
        order.ref = bid.ref;
      } else {
        console.log("WARNING: there are no bid orders to delete.");
        order = null;
      }
    } else if (order.side == 'ask') {
      if (book.asks.length > 0) {
        var queue = sample(book.asks);
        var ask = sample(queue.orders);
        order.price = ask.price;
        order.ref = ask.ref;
      } else {
        console.log("WARNING: there are no ask orders to delete.");
        order = null;
      }
    }
  } else if (order.type == 'mkt') {
    order.side = randomSide();
    if (order.side == 'bid' && book.asks.length > 0) {
      order.vol = randomVol();
    } else if (order.side == 'ask' && book.bids.length > 0) {
      order.vol = randomVol();
    } else {
      console.log("WARNING: there are no orders to execute.");
      order = null;
    }
  }
  if (args.verbose) console.log('order=', order);
  return order;
}

function simulate(book, display) {

  console.log('Running simulation...');

  // Fill the book
  var orderCount = 0;
  while (orderCount < args.minStartingOrders) {
    var order = randomOrder(book, type='add');
    if (order != null) {
      book.update(order);
      ++orderCount;
    }
  }
  display.init();

  // Random messaging...
  var orderCount = 0;
  function generateOrders() {
    if (orderCount < args.maxMessages) {
      var ms = args.maxDelay * Math.random();
      var order = randomOrder(book);
      if (order != null) {
        book.update(order);
        display.drawFrame();
        ++orderCount;
      }

      setTimeout(generateOrders, ms);
    } else {
      console.log("Reached end of trading. Shutting down simulation.");
    }
  }
  generateOrders();
}

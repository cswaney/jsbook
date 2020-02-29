// FIFO Queue
var Queue = {
    data: [],
    pop: function() {
        var val = this.data[0];
        this.data = this.data.slice(1);
        return val;
    },
    removeAtIndex: function(index) {
        return this.data.splice(index, 1);
    },
    push: function(...vals) {
        for (let val of vals) {
            this.data.push(val);
        }
    },
    append: function(vals) {
        for (let val of vals) {
            this.push(val);
        }
    },
    toString: function() {
        return JSON.stringify(this.data, undefined);
    },
    create: function() {
        var queue = Object.create(Queue);
        return Object.assign(queue, {
            data: []
        })
    }
}

// TEST
// var q = Object.create(Queue);
// q.push(0, 1, 2, 3);
// q.pop();
// q.append([4, 5, 6]);
// q.pop();


// Order
var Order = {
    timestamp: 0.,
    refno: 0,
    type: undefined,  // add, delete
    shares: 0,
    price: 0.,

    toString: function() {
        return JSON.stringify(this, undefined, 2);
    },
    create: function(type, shares, price) {
        var timestamp = createTimestamp();
        var refno = createRefno();
        var order = Object.create(Order);
        return Object.assign(order, {
            timestamp: timestamp,
            refno: refno,
            type: type,
            shares: shares,
            price: price
        })
    },
    updateValues: function(newValues) {
        Object.assign(this, newValues);
    }
}

function createTimestamp() {
    return Date.now();
}

function createRefno() {
    return Math.floor(Math.random() * 1e9)
}

// TEST
// var newOrder = order('add', 100, 90.00)
// addOrder.updateValues({ type: 'delete', })


// Book
var Book = {
    queues: new Map(),
    type: undefined,  // "bid" or "ask"
    bestBidAskKey: undefined,

    toString: function() {
        return JSON.stringify(this, undefined, 2);
    },
    create: function(type) {
        var book = Object.create(Book);
        return Object.assign(book, {
            queues: new Map(),
            type: type,
            bestBidAskKey: undefined
        })
    },
    add: function(order) {
        var queue = this.queues.get(order.price);
        if (queue) {
            queue.push(order);
            console.log(`added order: ${ order }`)
        } else {
            var queue = Queue.create();
            this.queues.set(order.price, queue);
            console.log(`added new queue: ${ order.price }`)
            queue.push(order);
            console.log(`added order: ${ order }`)
            this.update();
        }
    },
    delete: function(order) {
        // check if the order price exists
        var queue = this.queues.get(order.price);
        if (queue) {
            // check if the order refno exists
            var index = queue.data.findIndex(function(o) {
                return o.refno == order.refno
            })
            if (index > -1) {
                // remove the order
                queue.removeAtIndex(index);
                console.log(`removed order: ${ order }`)
                // check if the queue is empty
                if (queue.data.length == 0) {
                    this.queues.delete(order.price);
                    console.log(`deleted queue: ${ order.price }`);
                    this.update();
                }
            } else {
                console.log("order not found: no matching refno");
            }
        } else {
            console.log("order not found: no matching price")
        }
    },
    update: function() {
        var bestPrice;
        for (let price of this.queues.keys()) {
            if (this.type == "bid") {
                if (!bestPrice) {
                    bestPrice = price;
                } else {
                    if (price > bestPrice) {
                        bestPrice = price;
                    }
                }
            } else if (this.type == "ask") {
                if (!bestPrice) {
                    bestPrice = price;
                } else {
                    if (price < bestPrice) {
                        bestPrice = price;
                    }
                }
            }
        }
        this.bestBidAskKey = bestPrice;
    }
}

// TEST
var book = Book.create('bid');
// add an order
var addOrder = Order.create('add', 100, 90.00);
book.add(addOrder);
// an another order at the same price
var addOrder = Order.create('add', 100, 90.00);
book.add(addOrder);
// add an order at a new price
var addOrder = Order.create('add', 100, 91.00);
book.add(addOrder);
// delete the last order
addOrder.updateValues({type: 'delete',})
book.delete(addOrder);



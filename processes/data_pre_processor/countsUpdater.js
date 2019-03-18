var Time = require("../../commons/time.js");
var CountsUpdater = function (db, collection) {
    var self = this
    self.counts = {}
    self.db = db
    self.collection = collection
    self.time = new Time();
}
var method = CountsUpdater.prototype;
method.registerKey = function (key) {
    var self = this
    self.counts[key] = 0
}
method.incr = function (key, val) {
    var self = this
    self.counts[key] = self.counts[key] + val
}
method.updateCounts = function (cb) {
    var self = this;
    cb = cb || function () {
        }
    var db = self.db;
    var setObj = {}
    for (var key in self.counts) {
        // self.counts[key] = 1
        setObj[key] = self.counts[key];
        self.counts[key] = 0;
    }
    var date = new Date().getDate()
    console.log("counts", setObj);
    db.collection(self.collection).updateOne({
        "date": parseInt(self.time.getNPreviousDateStamp(0))
    }, {"$inc": setObj}, {}, function (err, resp) {
        if (err) {
            throw new Error(err)
        } else {
            if (resp.result.n == 0) {
                console.log(resp.result)
                setObj["date"] = parseInt(self.time.getNPreviousDateStamp(0));
                db.collection(self.collection).insert(setObj, function (err, res) {
                    if (err) {
                        delete setObj["_id"]
                        if (err.code === 11000) {
                            delete setObj["date"];
                            db.collection(self.collection).updateOne(
                                {"date": parseInt(self.time.getNPreviousDateStamp(0))},
                                {$inc: setObj}, {}, function (err, resp) {
                                    if (err) {
                                        throw new Error(err)
                                    } else {
                                        return cb()
                                    }

                                });
                        }
                        else {
                            throw new Error(err)
                        }
                    } else {
                        return cb()
                    }
                });

            } else {
                return cb()
            }
        }
    });
}

method.setUpSchedule = function (interval) {
    var self = this
    self.updateIntervalId = setInterval(function () {
        // console.log(self.collection)
        self.updateCounts()
    }, interval)
    // self.updateIntervalId = setInterval(self.updateCounts, interval)
}

method.closeUpdateSchedule = function () {
    clearInterval(this.updateIntervalId)
}
module.exports = CountsUpdater;
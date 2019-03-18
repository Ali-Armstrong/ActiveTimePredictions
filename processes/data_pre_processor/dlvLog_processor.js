var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongodb = require('mongodb');
var amqp = require('amqplib/callback_api');
var MongoClient = mongodb.MongoClient;
var q = configuration.rabbitmq.dlvrs.q;
var exchange = configuration.rabbitmq.dlvrs.exchange;
var bindingkey = configuration.rabbitmq.dlvrs.bindingkey;
var redis = require('redis');
var mongoConnector = require("../../commons/mongoConnection.js")
var redisConnector = require("../../commons/redisConnection.js")
var async = require('async')
var CountsUpdater = require("./countsUpdater.js");
var countsUpdater
var db;
var rab_ch;
var r_client
var countsUpdateInterval = 5000;
var slotPreBuffer = 0.05
redisConnector.createRedisConnection(configuration.redis, function (err, rdcli) {
    if (err) {
        throw new Error(err);
    }
    r_client = rdcli;
    console.log('connected to redis');
    mongoconnect()
})

function mongoconnect() {
    mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        countsUpdater = new CountsUpdater(db, configuration.mongodb.UATP_monitor_stats);
        countsUpdater.registerKey("hits")
        countsUpdater.registerKey("predictedHits")
        countsUpdater.registerKey("pftHits")
        countsUpdater.registerKey("outHits")
        countsUpdater.registerKey("invalidCmpIdInDlv")
        countsUpdater.registerKey("notTryToHit")
        rabbit();
    });
}

function rabbit() {
    var url = 'amqp://' + configuration.rabbitmq.username + ":" + encodeURIComponent(configuration.rabbitmq.password) + "@" + configuration.rabbitmq.server + ":" +
        configuration.rabbitmq.port + '/';
    amqp.connect(url, function (err, conn) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("rab_connection Succeessfull");
            countsUpdater.setUpSchedule(countsUpdateInterval);
            conn.createChannel(function (err, ch) {
                ch.assertExchange(exchange, 'direct', {durable: true});
                ch.assertQueue(q, {durable: true});
                ch.bindQueue(q, exchange, bindingkey);
                rab_ch = ch;
                ch.prefetch(1000);
                ch.consume(q, function (msg) {
                    dataprocess(JSON.parse(msg.content.toString()), function (res) {
                        ch.ack(msg);
                    });
                }, {noAck: false});
            });
        }
    });
}


function dataprocess(msg, ch) {
    if (!msg.cmpId) {
        countsUpdater.incr("invalidCmpIdInDlv", 1)
        return ch();
    }
    var time = parseInt(msg.dlvTime)
    var date = new Date(time * 1000);
    var d = date.getDay() + 1;
    var spl;
    if (d == 1) {
        spl = 2;
    } else {
        spl = 1;
    }
    var h = date.getHours();
    var m = date.getMinutes();
    if (m < 10) {
        m = '0' + m;
    }
    var t = parseFloat(h + '.' + m)
    checkIntimeOrNot(db, msg.emId, d, t, function (inTime) {
        countsUpdater.incr("hits", 1)
        if (!inTime) {
            console.log("unpredicted data", msg)
            return ch();
        }else{
            if(!msg.status){
            }else{
                countsUpdater.incr("notTryToHit",1)
            }
        }
        if (inTime[0] == 1) {
            console.log("pftHit data", msg)
            countsUpdater.incr("pftHits", 1)
            return insertInTSlog(db, msg.cmpId, msg.emId, msg.dlvTime, inTime, ch)
        }
        if (inTime[0] == 2) {
            console.log("outHit data", msg)
            countsUpdater.incr("outHits", 1)
            return insertInTSlog(db, msg.cmpId, msg.emId, msg.dlvTime, inTime, ch)
        }
        throw new Error("something went wrong--" + JSON.stringify(msg))
    })

}


function insertInTSlog(db, cmpId, eId, dlvTime, iOoDl, cb) {
    db.collection(configuration.mongodb.UATP_ts_log).insert(
        {
            "cId": cmpId,
            "eId": parseInt(eId),
            "dlT": dlvTime,
            "iOoDl": iOoDl[0],
            "s":iOoDl[1]
        }, function (err, res) {
            if (err) {
                if (err.code === 11000) {
                    db.collection(configuration.mongodb.UATP_ts_log).updateOne(
                        {"cId": cmpId, "eId": eId},
                        {"$set": {"dlT": dlvTime, "iOoDl": iOoDl[0],"s":iOoDl[1]}}, function (err, resp) {
                            if (err) {
                                throw new Error(err)
                            } else {
                                return cb();
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
}

function checkIntimeOrNot(db, emId, day, rTime, cb) {
    db.collection(configuration.mongodb.collection2).findOne(
        {
            "dmpEmId": parseInt(emId),
            "day": day
        }, function (err, doc) {
            if (err) {
                throw new Error(err)
            }
            if (!doc) {
                return cb()
            }
            countsUpdater.incr("predictedHits", 1)
            var slots = doc.slots;
            var isInTime = matchReactionTimes(rTime, slots)
            cb(isInTime)
        });
}

function matchReactionTimes(rTime, hstTimes) {
    rTime = parseFloat((rTime + slotPreBuffer).toFixed(2))
    if (rTime > 23.59) {
        rTime = parseFloat((rTime - 23.59).toFixed(2))
    }
    for (var i in hstTimes) {
        var slot = hstTimes[i];
        // slot = shiftBack(slot.f, slot.t, slotPreBuffer)
        // var toT = shiftBack(slot.t, slot.t, slotPreBuffer)
        // console.log("f1", fromT, "t1", toT)
        // console.log(slot)
        //console.log(rTime)
        if (rTime >= slot.f && rTime <= slot.t) {
            return [1,slot.s]
        }
    }
    return [2,0]
}
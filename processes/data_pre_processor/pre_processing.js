var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongodb = require('mongodb');
var amqp = require('amqplib/callback_api');
var MongoClient = mongodb.MongoClient;
var q = configuration.rabbitmq.reactions.q;
var exchange = configuration.rabbitmq.reactions.exchange;
var bindingkey = configuration.rabbitmq.reactions.bindingkey;
var redis = require('redis');
var mongoConnector = require("../../commons/mongoConnection.js");
var redisConnector = require("../../commons/redisConnection.js");
var async = require('async');
var CountsUpdater = require("./countsUpdater.js");
var schedule = require('node-schedule');
var countsUpdater;
var db;
var rab_ch;
var r_client;
var timebuffer=0.3;
var countsUpdateInterval = 5000;

//noinspection JSAnnotator
schedule.scheduleJob({hour: 0 , minute: 1}, function(){
    var temp=new Date().getTime();
    var d=new Date().getDay();
    if(d==0)
        d=7;
    //console.log(d);
    db.collection(configuration.mongodb.collection1).update({
        "day":d
    }, {"$unset":{"status":1}}, {upsert: false,multi:true}, function (err, resp) {
        //console.log(resp.message.response)
        if (err) {
            throw new Error(err)
        } else {
            console.log("status updated....",(new Date().getTime())-temp);
        }
    });
});

redisConnector.createRedisConnection(configuration.redis, function (err, rdcli) {
    if (err) {
        throw new Error(err);
    }
    r_client = rdcli;
    console.log('connected to redis');
    mongoconnect()
});

function mongoconnect() {
    mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        countsUpdater = new CountsUpdater(db, configuration.mongodb.UATP_monitor_stats);
        countsUpdater.registerKey("reacts");
        countsUpdater.registerKey("predictedReacts");
        countsUpdater.registerKey("newReacts");
        countsUpdater.registerKey("inReacts");
        countsUpdater.registerKey("outReacts");
        countsUpdater.registerKey("OpensWithoutDlvLog");
        countsUpdater.registerKey("invalidCmpIdInOpen");
        countsUpdater.registerKey("invaliddmpEmId");
        rabbit();
    });
}

function rabbit() {
    var url = 'amqp://' + configuration.rabbitmq.username + ":" + encodeURIComponent(configuration.rabbitmq.password) + "@" + configuration.rabbitmq.server + ":" +
        configuration.rabbitmq.port + '/';
    amqp.connect(url, function (err, conn) {
        if (err) {
            throw new Error(err)
        }
        else {
            console.log("rab_connection Succeessfull");
            countsUpdater.setUpSchedule(countsUpdateInterval);
            conn.createChannel(function (err, ch) {
                ch.assertExchange(exchange, 'direct', {durable: true});
                ch.assertQueue(q, {durable: true});
                ch.bindQueue(q, exchange, bindingkey);
                rab_ch = ch;
                ch.prefetch(500);
                ch.consume(q, function (msg) {
                    dataprocess(JSON.parse(msg.content.toString()), function (res) {
                        countsUpdater.incr("reacts", 1);
                        ch.ack(msg);
                    });
                }, {noAck: false});
            });
        }
    });
}


function dataprocess(msg, ch) {
    if (!msg.cmpId) {
        countsUpdater.incr("invalidCmpIdInOpen", 1);
        return ch();
    }
    if(!msg.emId){
        countsUpdater.incr("invaliddmpEmId", 1);
        return ch();
    }
    var time = parseInt(msg.openTime);
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
    var t = parseFloat(h + '.' + m);
    var tm = {
        "t": t,
        "d": parseInt(msg.openTime)
    }
    //console.log(tm,d)
    function updateUserHistory(msg, inTime, callback) {
        //console.log({"emId":parseInt(msg[0]),"day" : d},{"$push": {"opens": tm}, "$unset": {"status": 1}})
        var updateDoc = {"status": 1}
        if (inTime&&inTime[0] == 1) {
            countsUpdater.incr("inReacts", 1);
            updateDoc["pdS"] = inTime[0]
        }
        else if (inTime&&inTime[0] == 2) {
            countsUpdater.incr("outReacts", 1);
            updateDoc["pdS"] = inTime[0]
        }
        db.collection(configuration.mongodb.collection1).updateOne({
            "dmpEmId": parseInt(msg.emId),
            "day": d
        }, {"$push": {"opens": tm}, "$set": updateDoc}, {upsert: false}, function (err, resp) {
            //console.log(resp.message.response)
            if (err) {
                throw new Error(err)
            } else {
                if (resp.result.n == 0) {
                    getrediskey(function (res) {
                        res = parseInt(res);
                        db.collection(configuration.mongodb.collection1).insert(
                            {
                                _id: res,
                                "dmpEmId": parseInt(msg.emId),
                                "day": d,
                                "spl": spl,
                                "opens": [tm]
                            }, function (err, res) {
                                if (err) {
                                    if (err.code === 11000) {
                                        db.collection(configuration.mongodb.collection1).updateOne(
                                            {"dmpEmId": parseInt(msg.emId), "day": d},
                                            {"$push": {"opens": tm}, "$set": {"status": 1}}, function (err, resp) {
                                                if (err) {
                                                    throw new Error(err)
                                                } else {
                                                    countsUpdater.incr("newReacts", 1)
                                                    return callback()
                                                }

                                            });
                                    }
                                    else {
                                        throw new Error(err)
                                    }
                                } else {
                                    countsUpdater.incr("newReacts", 1)
                                    return callback()
                                }
                            });
                    });

                } else {
                    return callback()
                }
            }
        });
    }
    checkIntimeOrNot(db, msg.emId, d, t, function (inTime) {
        //console.log(inTime)
        updateUserHistory(msg, inTime, function () {
            if (inTime&&(inTime[0] == 1 || inTime[0] == 2)) {
                return updateTSlog(db, msg.cmpId, msg.emId, msg.openTime, inTime, ch)
            }
            return ch()
        })
    })

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
                console.log("################ch1")
                return cb()
            }
            countsUpdater.incr("predictedReacts", 1)
            var slots = doc.slots;
            var isInTime = matchReactionTimes(rTime, slots)
            cb(isInTime)
        });
}

function matchReactionTimes(rTime, hstTimes) {
    var frac_fd,frac_fi,frac_td,frac_ti,deci_f,deci_t;
    var min=24;
    for (var i in hstTimes) {
        //console.log(hstTimes[i].t);
        var slot = JSON.stringify(hstTimes[i]);
        slot=JSON.parse(slot);
        //console.log(slot.f)
        slot.f=parseFloat(slot.f);
        slot.t=parseFloat(slot.t);
        deci_f = parseFloat(parseFloat(slot.f - Math.floor(slot.f)).toFixed(2));
        deci_t = parseFloat(parseFloat(slot.t - Math.floor(slot.t)).toFixed(2));
        if(slot.f>0.3) {
            if (deci_f < timebuffer) {
                frac_fd = (0.6 - (timebuffer - deci_f));
                frac_fi = (Math.floor(slot.f)) - 1;
                if (frac_fi < 0)
                    frac_fi = 23;
                slot.f = frac_fi + frac_fd;
            } else
                slot.f -= timebuffer;
        }
        if(slot.t<23.3){
            if (deci_t >= timebuffer) {
                frac_td = (deci_t - timebuffer);
                frac_ti = (Math.floor(slot.t)) + 1;
                if (frac_ti >= 24)
                    frac_ti = 0;
                slot.t = frac_ti + frac_td;
            } else
                slot.t += timebuffer;
        }
        //console.log(rTime,slot.f,slot.t,hstTimes[i].t);
        if (rTime >= slot.f && rTime <= slot.t) {
            return [1,0]
        }else{
            rTime=parseFloat(Math.round(rTime * 100) / 100).toFixed(2);
            hstTimes[i].t=parseFloat(Math.round(hstTimes[i].t * 100) / 100).toFixed(2);
            var tem=diff(hstTimes[i].t,rTime);
            if(rTime-parseFloat(hstTimes[i].t)>0&&min>tem)
                min=tem;
        }
    }

    return [2,parseFloat(min)]
}

//var temp=diff("1.4","2.2")
//console.log(temp)
function diff(start, end) {
    start = start.split(".");
    end = end.split(".");
    var startDate = new Date(0, 0, 0, start[0], start[1], 0);
    var endDate = new Date(0, 0, 0, end[0], end[1], 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);

    return (hours < 9 ? "0" : "") + hours + "." + (minutes < 9 ? "0" : "") + minutes;
}

function getrediskey(callback) {

    r_client.hincrby("UATP_ids", "UATP_usersHistory__id", 1, function (err, res) {
        if (err) {
            throw new Error(err)
        } else {
            callback(res);
        }
    });
}

function updateTSlog(db, cmpId, eId, openTime, iOoR, ch) {
    db.collection(configuration.mongodb.UATP_ts_log).updateOne(
        {"cId": cmpId, "eId": parseInt(eId),"$or":[{"iOoR":{"$exists":false}},{"iOoR":{"$gt":iOoR[0]}}]},
        {"$set": {"opT": openTime, "iOoR": iOoR[0], "dl":iOoR[1]}}, {upsert: false}, function (err, resp) {
            //console.log(resp.message.response)
            if (err) {
                throw new Error(err)
            } else {
                if (resp.result.n == 0) {
                    countsUpdater.incr("OpensWithoutDlvLog", 1);
                    return ch();
                } else {
                    return ch()
                }
            }
        });
}

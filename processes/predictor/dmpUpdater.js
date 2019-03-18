var runningEnv = process.argv[2];
var aes = require("./aes.js")
var schedule = require('node-schedule');
var socketBroken = false;
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongoConnector = require("../../commons/mongoConnection.js")
var redisConnector = require("../../commons/redisConnection.js")
var DmpApi = require("../../commons/dmpApi.js")
var request = require('request');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var update_db;
const mongo_options = {
    socketTimeoutMS: 30000,
    keepAlive: true,
    reconnectTries: 30000
};
const mongoURI = configuration.mongodb.uri;


schedule.scheduleJob({hour: 1, minute: 01}, function(){

    var temp=new Date().getTime();
    console.log("updating records....")
    update_db.collection(configuration.mongodb.collection2).update({
        "status":1
    }, {"$unset":{"status":1}}, {upsert: false,multi:true}, function (err, resp) {
        //console.log(resp.message.response)
        if (err) {
            throw new Error(err)
        } else {
            console.log("status updated....",(new Date().getTime())-temp);
        }
    });
});

function update_records_mongo_conn() {

    MongoClient.connect(mongoURI, mongo_options, function(err, dbase) {
        if(err)
            throw new Error(err);
        console.log("update records Mongo Connection Succeessfull");
        update_db=dbase;
    });
}

redisConnector.createRedisConnection(configuration.redis, function (err, rdcli) {
    if (err) {
        throw new Error(err);
    }
    console.log('connected to redis');
    dmp = new DmpApi(rdcli);
    dmp.loadAccessTokenFromRedis(function () {
        socket_connect()
    });
})

function socket_connect() {
    var main = require("../io-socket-client/main.js");

    sendConnection = main.getSendDataConnection();

    sendConnection.socketConnectionListener(function (brocken) {
        if (brocken) {
            socketBroken = true;
            setTimeout(socket_connect, 10000);
        } else {
            socketBroken = false;
        }
    });

    sendConnection.authenticate(configuration.socket.email, configuration.socket.password, function (err, res) {
        if (err) {
            throw new Error(JSON.stringify(err))
        } else {
            sendConnection.registerCallback(function (err, res) {
                if (err) {
                    throw new Error(err)
                } else {
                    if (res.status == 'SUCCESS') {
                        if (res.data.invalidFields.invalid) {
                            console.log("########INVALID DATA", JSON.stringify(res))
                            updatestatus(-1, res.data.sentFields._id)
                        }
                        else {
                            updatestatus(3, res.data.sentFields._id)
                        }
                        counts_increase()
                    }
                }
            });
            mongoconnect()
        }
    });
}


function counts_increase() {
    var d = new Date();
    //console.log(d)
    db.collection(configuration.mongodb.collection3).updateOne({
        "day": d.setHours(0, 0, 0, 0)
    }, {
        $inc: {
            "count": 1
        },
    }, {
        upsert: true
    }, function (err, results) {
        if (err) {
            if (err.code === 11000) {
                db.collection(configuration.mongodb.collection3).updateOne({
                    "day": d.setHours(0, 0, 0, 0)
                }, {
                    $inc: {
                        "count": 1
                    },
                }, {
                    upsert: false
                }, function (err, resp) {
                    if (err) {
                        throw new Error(err)
                    }
                });
            }
            else {
                throw new Error(err)
            }
        }
    });
}

function updatestatus(status, id) {
    db.collection(configuration.mongodb.collection2).updateOne({
        "_id": id,
        "status": 2
    }, {
        $set: {
            "status": status
        }
    }, {
        upsert: false
    }, function (err, results) {
        if (err) {
            throw new Error(err)
        }
    });
}


function mongoconnect() {
    mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        startprocess();
        update_records_mongo_conn();
    });
}

function startprocess() {
    db.collection(configuration.mongodb.collection2).find({
        "status": {$exists: false}
    }).limit(100).toArray(function (err, results) {
        if (err) {
            throw new Error(err)
        } else {
            if (results.length == 0) {
                console.log('waiting for records...')
                setTimeout(startprocess, 300000);
            }
            else {
                //console.log('got data')
                async.forEach(results, sendpredictions, function (err) {
                    if (err) {
                        throw new Error(err)
                    } else {
                        startprocess()
                    }
                });
            }
        }
    });
}

function sendpredictions(doc, callback) {
    var day;
    switch (doc.day) {
        case 1:
            day = "sun";
            break;
        case 2:
            day = "mon";
            break;
        case 3:
            day = "tue";
            break;
        case 4:
            day = "wed";
            break;
        case 5:
            day = "thu";
            break;
        case 6:
            day = "fri";
            break;
        case 7:
            day = "sat";
    }
    getEmailid(doc.dmpEmId, function (err, res) {
        if (err) {
            throw new Error(err)
        }
        var values = [];
        for (var p in doc.slots) {
            var tmp = {};
            tmp.from = parseFloat(doc.slots[p].f);
            tmp.to = parseFloat(doc.slots[p].t);
            tmp.score = doc.slots[p].s;
            values.push(tmp)
        }
        var temp = {
            "_id": doc._id,
            "email": res,
            "reactionTime": [
                {
                    "day": day,
                    "values": values
                }
            ]
        }
        if (!socketBroken) {
            //console.log(JSON.stringify(temp))
            sendConnection.sendData(temp)
            db.collection(configuration.mongodb.collection2).updateOne({
                "_id": doc._id,
                "status": null
            }, {
                $set: {
                    "status": 2
                }
            }, {
                upsert: false
            }, function (err, results) {
                if (err) {
                    throw new Error(err)
                }
            });
            return callback()
        }
    });
}

function getEmailid(id, cb) {
    console.log(id)
    dmp.getEmailById(id, cb)
}

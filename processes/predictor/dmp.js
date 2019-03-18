var runningEnv = process.argv[2];
var aes = require("./aes.js")
var socketBroken = false;
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongoConnector = require("../../commons/mongoConnection.js")
var request = require('request');
var async = require('async')
var sendConnection;

socket_connect();

function socket_connect() {
    var main = require("../io-socket-client/main.js");

    sendConnection = main.getSendDataConnection();

    sendConnection.socketConnectionListener(function (brocken) {
        if (brocken) {
            socketBroken = true;
            socket_connect()
        } else {
            socketBroken = false;
        }
    });

    sendConnection.authenticate(configuration.socket.email, configuration.socket.password, function (err, res) {
        if (err) {
            throw new Error(err)
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
                            updatestatus(2, res.data.sentFields._id)
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
        startprocess()
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
                setTimeout(startprocess, 300000);
            }
            else {
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
    getEmailid(doc.emId, function (res) {
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
    //console.log(id)
    var t = new Date();
    var url = "http://plabs.truepush.com/getMailbyId?id=" + id;
    request(url, function (error, response, body) {
        if (error) {
            throw new Error(error);
        } else if (response.statusCode == 200) {
            //console.log(body)
            var t2 = new Date()
            console.log(t2 - t)
            var recipemail = aes.decrypt(body);
            cb(recipemail)
        }
    });
}

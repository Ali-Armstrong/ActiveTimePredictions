var runningEnv = process.argv[2]
var config = require("../../config/" + runningEnv + "/config.json");
var mongoConnector = require("../../commons/mongoConnection.js")
var DmpApi = require("../../commons/dmpApi.js")
var async = require("async")
var request = require("request")
var aes = require("../predictor/aes.js")
var db;
var fetchLimit = 150;
var src_collection = config.mongodb.collection1;
var truePushUrl = "http://plabs.truepush.com/getMailbyId?id="
var countsObj = {
    "capsDups": 0,
    "notFoundIndDmp": 0
}
var dmpApi = new DmpApi();
function connectToMongo() {
    mongoConnector.createMongoConnection(config.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        iterate()
    });
}

function iterate() {
    getChunkOfData(function (data) {
        if (data.length == 0) {
            console.log("waiting for data");
            setTimeout(function () {
                iterate();
            }, 60000)
            return;
        }
        async.forEach(data, processRecord, function (err) {
            if (err) {
                throw new Error(err)
            } else {
                setImmediate(iterate)
            }
        });
    })
}

function processRecord(doc, callback) {
    var tpId = doc.emId;
    getTruepushEmailfromId(tpId, function (err, tpEmail) {
        if (err) {
            console.log(err, tpId);
            var updateDoc = {$set: {sts_idc: 5}}
            finalUpdate(doc, updateDoc, function (res) {
                callback();
            });
            return
        }
        getDmpIdForEmail(tpEmail, function (err, dmpId) {
            if (err) {
                console.log(err, tpEmail, tpId);
                var updateDoc = {$set: {sts_idc: 4}}
                finalUpdate(doc, updateDoc, function (res) {
                    callback();
                })
                return
            }
            doc.dmpEmId = dmpId;
            var updateDoc = {$set: {dmpEmId: doc.dmpEmId, sts_idc: 1}}
            finalUpdate(doc, updateDoc, function (res) {
                callback();
            })
        })
    })
}

function getChunkOfData(callback) {
    db.collection(src_collection).find({
        "sts_idc": {$exists: false}
    }).limit(fetchLimit).toArray(function (err, results) {
        if (err) {
            throw new Error(err)
        } else {
            callback(results)
        }
    });
}

function finalUpdate(doc, updateDoc, cb) {
    db.collection(src_collection).updateOne({
        "_id": doc._id,
        "sts_idc": null
    }, updateDoc, {
        upsert: false
    }, function (err, results) {
        if (!err) {
            return cb();
        }
        if (err.code != 11000) {
            throw new Error(err)
        }
        db.collection(src_collection).findOne({
            "dmpEmId": doc.dmpEmId,
            "day": doc.day
        }, function (err, otherDoc) {
            if (err) {
                throw new Error(err)
            }
            var mergedOpens = mergeArrays(doc.opens, otherDoc.opens);
            otherDoc.opens = mergedOpens;
            db.collection(src_collection).updateOne({
                "_id": otherDoc._id
            }, {
                $set: {
                    "opens": otherDoc.opens
                }
            }, {
                upsert: false
            }, function (err, results) {
                if (err) {
                    throw new Error(err)
                }
                countsObj.capsDups++;
                db.collection(src_collection).updateOne({
                    "_id": doc._id
                }, {
                    $set: {
                        "sts_idc": 2
                    }
                }, {
                    upsert: false
                }, function (err, results) {
                    if (err) {
                        throw new Error(err)
                    }
                    cb();
                });
            });
        });
    });
}

function mergeArrays(arr1, arr2) {
    var arr3 = arr1.concat(arr2)
    return arr3
}

function getTruepushEmailfromId(id, cb) {
    var t = new Date();
    var url = truePushUrl + id;
    request(url, function (error, response, body) {
        if (error) {
            throw new Error(error);
        } else if (response.statusCode == 200) {
            var recipemail;
            try {
                var recipemail = aes.decrypt(body);
                if (recipemail.length < 2) {
                    throw new Error("some thing went wrong--" + body + "--" + recipemail)
                }
                cb(null, recipemail)
            }
            catch (exp) {
                cb(exp)
            }
        }
        else {
            throw new Error(response);
        }
    });
}

function getDmpIdForEmail(email, cb) {
    dmpApi.getIdByEmail(email, cb)
}

connectToMongo()


/*
 create index on sts_idc
 create unique index of dmpEmId,day
 remove records with status 2
 */
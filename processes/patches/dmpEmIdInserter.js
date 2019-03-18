var runningEnv = process.argv[2]
var config = require("../../config/" + runningEnv + "/config.json");
var mongoConnector = require("../../commons/mongoConnection.js")
var DmpApi = require("../../commons/dmpApi.js")
var async = require("async")
var request = require("request")
var shortid = require('shortid');
var aes = require("../predictor/aes.js")
var db;
var fetchLimit = 500;
var src_collection = config.mongodb.collection1;
var truePushUrl = "http://plabs.truepush.com/getMailbyId?id="
var countsObj = {
    "capsDups": 0
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
    var updateDoc = {$set: {dmpEmId: shortid.generate(), sts_idc: 1}}
    finalUpdate(doc, updateDoc, function (res) {
        callback();
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
            var recipemail = aes.decrypt(body);
            if (recipemail.length < 2) {
                throw new Error("some thing went wrong--" + body + "--" + recipemail)
            }
            cb(recipemail)
        }
    });
}

function getDmpIdForEmail(email, cb) {
}

connectToMongo()


/*
 create index on sts_idc
 create unique index of dmpEmId,day
 remove records with status 2
 */
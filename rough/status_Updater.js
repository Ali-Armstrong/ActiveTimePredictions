var runningEnv = process.argv[2];
var configuration = require("../config/" + runningEnv + "/config.json")
var mongoConnector = require("../commons/mongoConnection.js")
var async = require('async')


mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
    if (err) {
        throw new Error(err);
    }
    console.log("Mongo Connection Succeessfull");
    db = db1;
    startprocess()
});

function startprocess() {
    db.collection(configuration.mongodb.collection2).find({
    }).limit(10000).toArray(function (err, results) {
        if (err) {
            throw new Error(err)
        } else {
            async.forEach(results, update_status, function (err) {
                if (err) {
                    throw new Error(err)
                } else {
                    console.log('Process complete')
                }
            });
        }
    });
}

function update_status(doc,cb) {

    db.collection(configuration.mongodb.collection2).updateOne({
        "_id": doc._id
    }, {
        $unset: {
            "status": 1
        }
    }, {
        upsert: false
    }, function (err, results) {
        if (err)
            throw new Error(err)
        else
            return cb()
    });
}
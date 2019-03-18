"use strict";

var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json");
var mongoConnector = require("../../commons/mongoConnection.js");
var redisConnector = require("../../commons/redisConnection.js");
var redis = require('redis');
var async = require('async');
var r_client;
var db;

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
        start_cleaner()
    });
}

function start_cleaner(){

    getrediskey(function(res){
    console.log(res);
    //console.log(typeof(res))
        db.collection(configuration.mongodb.collection1).find({"_id":{$gt:parseInt(res)}}).sort({"_id":1}).limit(100).toArray(function (err, results) {
                if (err) {
                    throw new Error(err)
                } else {
                    if (results.length == 0) {
                        console.log('waiting for records');
                        setTimeout(function () {
                            r_client.hset("UATP_ids", "UATP_cleaner__id", 0,function (err,res) {
                               if(err) {
                                   throw new Error(err)
                               }
                               start_cleaner();
                            });

                        }, 259200000);

                    }
                    else {
                        async.forEach(results, clean_records, function (err) {
                            if (err) {
                                throw new Error(err)
                            } else {
                                start_cleaner()
                            }
                        });
                    }
                }
            });
    });
}

function clean_records(doc,callback){
    //var d = new Date();
    //var t=d.setDate(d.getDate() - 60);
    //hsconsole.log(doc)
    doc.opens = doc.opens.filter((opens, index, self) =>
        index === self.findIndex((x) => (
    	    x.t === opens.t && x.d-opens.d<86400
            //console.log(x.t,opens.t)
    	))
    )


    db.collection(configuration.mongodb.collection1).updateOne({
        "_id": doc._id,
        }, {
           $set: {
              "opens": doc.opens
           }
           },{
                upsert: false
           },function (err, results) {
                if (err) {
                    throw new Error(err)
                }
                else{
                    r_client.hset("UATP_ids", "UATP_cleaner__id", doc._id);
                    return callback()
                }
           });
}


function getrediskey(callback) {
    r_client.hget("UATP_ids", "UATP_cleaner__id", function (err, res) {
       if(res)
        callback(res)
       else
        callback(0)
    });
}

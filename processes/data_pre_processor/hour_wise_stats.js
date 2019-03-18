/**
 * Created by sys1108 on 13/12/17.
 */
'use strict'
var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoConnector = require("../../commons/mongoConnection.js");
var db;

mongoconnect();

var day=1;

function mongoconnect() {
    mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        var today=new Date();
        today.setHours(0,0,0,0);
        start(day,today.getTime());
    });
}

var temp=0;
var slots=[];

function start(d,date) {
    //console.log('start')
    for(var i=0;i<24;i++)
        get_hour_wise_stats(date,d,i,i+1)
}

function  get_hour_wise_stats(date,d,time_from,time_to) {
    //console.log('get_hour_wise')
    db.collection(configuration.mongodb.collection2).count({day:d,slots:{$elemMatch:{f:{$lt:time_to},t:{$gt:time_from}}}}, function(error, numOfDocs) {
        if(error)
            throw new Error(error);
        else{
            temp+=1;
            var obj={};
            obj.timings=time_from;
            obj.count=numOfDocs;
            slots.push(obj);
            if(temp==24){
                temp=0;
                save_counts(date,d,slots);
                slots=[];
                if(d<7){
                   day=d+1;
                   start(day,date)
                }
                else{
                    db.close();
                    console.log('process completed...');
                }
            }
        }
    });
}


function save_counts(date,d,slots) {
    //console.log('save counts')
    db.collection(configuration.mongodb.UATP_hour_wise).insert(
        {
            "day": d,
            "date": date,
            "slots":slots
        }, function (err, res) {
            if (err)
                throw new Error(err)
            else
                return
        });
}
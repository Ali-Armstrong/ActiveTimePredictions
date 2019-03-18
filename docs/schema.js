//mongo

var collections = {
    UATP_RealPredictions: {
        schema: [
            {
                "_id": 1,
                "emId": "kamesh.nkr@gmail.com",
                "day": 1,
                "slots": [
                    {
                        "f": 0.0,
                        "t": 0.13,
                        "s": 40
                    }
                ],
                "status": 2
            }
        ],
        fields: ["day 1-7=sun-sat", "status null=needToProcess 1=updated 2=processed"],
        indexes: [
            {
                fields: {dmpEmId: 1, day: 1}, opts: {unique: true}
            }
        ]
    },
    OUATP_usersHistory: {
        schema: [
            {
                "_id": 1,
                "emId": "kamesh.nkr@gmail.com",
                "day": 1,
                "spl": 1,
                "opens": [
                    {
                        "t": 0.0,
                        "d": 1507141800
                    },
                    {
                        "t": 0.0,
                        "d": 1507141854
                    }
                ],
                "status": 2,
                "pdS": 1
            }
        ],
        fields: ["spl 1=working, 2=holiday", "day 1-7=sun-sat", "status null=needToProcess 1=updated 2=processed", "pdS 1=inTimeReacts 2=outTimeReacts null=can't say"],
        indexes: [
            {
                fields: {dmpEmId: 1, day: 1}, opts: {unique: true}
            },
            {
                fields: {status: 1}
            }
        ]
    },
    UATP_prediction_stats: {
        schema: [
            {
                "_id": ObjectId("5a0abae9698bb8dfaa10dc42"),
                "day": 1,
                "hour": 10,
                "count": 100
            },
            {
                "_id": ObjectId("5a0abae9698bb8dfaa10dc42"),
                "hour": 10,
                "count": 100
            }
        ],
        fields: [],
        indexes: [
            {
                fields: {day: 1, hour: 1}, opts: {unique: true}
            }
        ]
    },
    UATP_monitor_stats: {
        schema: [
            {
                "_id": ObjectId("5a0abae9698bb8dfaa10dc42"),
                "date": 1432523532,
                "hits": 100,
                "predictedHits": 20,
                "pftHits": 50,
                "outHits": 25,
                "reacts": 50,
                "newReacts": 30,
                "predictedReacts": 20,
                "inReacts": 25,
                "outReacts": 25,
                "OpensWithoutDlvLog": 10,
                "invalidCmpIdInDlv": 10,
                "invalidCmpIdInOpen": 10
            }
        ],
        fields: ["inReacts intimeReactions", "pftHits perfectHits"],
        indexes: [
            {
                fields: {date: 1}, opts: {unique: true}
            }
        ]
    },
    UATP_ts_log: {
        schema: [
            {
                "_id": ObjectId("5a0abae9698bb8dfaa10dc42"),
                "cId": 12,
                "eId": 100,
                "dlT": 20,
                "opT": 50,
                "ltH": 1,
                "iOoDl": 25,
                "iOoR": 50,
                "dl": 0.4
            }
        ],
        fields: ["cId campaignId", "eId dmpEmailId", "dlT deliveredTime", "opT openTime", "iOoDl intime or out time delivery, 1=intime, 2=outtime", "iOoR intime or out time reaction, 1=intime, 2=outtime", "ltH difference between opentime and sentime, 0-n","dl delay user active"],
        indexes: [
            {
                fields: {cId: 1, eId: 1}, opts: {unique: true},
                fields: {iOoDl: 1},
                fields: {iOoR: 1},
                fields: {dlT: 1}
            }
        ]
    },
    UATP_hour_wise_stats: {
        schema: [
            {
                "_id": ObjectId("5a0abae9698bb8dfaa10dc42"),
                "day": 1,
                "date":12345678,
                "slots":[
                    {
                        "timings":1,
                        "count":20
                    }
                ]
            }
        ],
        fields: ["day 1(sunday)-7(saturday)", "date stats_date", "slots hour_wise_slots", "timings lower_limit_of_hour", "count active_users_in_that_hour"],
        indexes: [
            {
                fields: {day: 1, date: 1}, opts: {unique: true}
            }
        ]
    }
}


//rabbitmq

var queues = {
    "UATP_userReactionLog": {
        schema: [
            {
                emId: 123,
                openTime: 13214234
            }
        ]
    },
    "UATP_userDeliveryLog": {
        schema: [
            {
                emId: 123,
                dlvTime: 13214234
            }
        ]
    }
}


//redis

var keys = {
    "UATP_ids": {
        "UATP_RealPredictions__id": 1,
        "UATP_usersHistory__id": 1
    }
}


/*
 {
 "mongodb": {
 "host": "103.18.248.30",
 "port": 27017,
 "username": "trueapp2",
 "password": "lka8waeasqq93#A",
 "db": "trueApp_v1"
 },
 "redis": {
 "host": "103.18.248.31",
 "port": 6300,
 "password": "way2redis"
 },
 "elasticsearch": {
 "host": "103.18.248.31",
 "port": 9200
 },
 "test": {
 "clId": 1,
 "apiKey": "rkeTJ7rEuZ"
 },
 "api": {
 "port": 5002,
 "url": "http://103.18.248.31:5002"
 }
 }

 */
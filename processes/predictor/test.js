/**
 * Created by sys1108 on 31/3/18.
 */
var runningEnv = process.argv[2];
var DmpApi = require("../../commons/dmpApi.js")
var configuration = require("../../config/" + runningEnv + "/config.json")
var redisConnector = require("../../commons/redisConnection.js")

redisConnector.createRedisConnection(configuration.redis, function (err, rdcli) {
    if (err) {
        throw new Error(err);
    }
    console.log('connected to redis');
    dmp = new DmpApi(rdcli);
    dmp.loadAccessTokenFromRedis(function () {
        start()
    });
})

function start() {
    console.log("started")
    getEmailid("lakshmi101192@gmail.com", function (err, res) {
        if (err) {
            throw new Error(err)
        } else {
            console.log(res)
        }
    })
}


function getEmailid(id, cb) {
    //console.log(id)
    dmp.getEmailById(id, cb)
}
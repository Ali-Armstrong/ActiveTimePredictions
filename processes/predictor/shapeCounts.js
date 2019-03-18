var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json")
var redisConnector = require("../../commons/redisConnection.js")
var r_client;
redisConnector.createRedisConnection(configuration.redis, function (err, rdcli) {
    if (err) {
        throw new Error(err);
    }
    r_client = rdcli;
    console.log('connected to redis');
    shapeCounts()
});
function shapeCounts() {
    r_client.hgetall("UATP_ids", function (err, result) {
        if (err) {
            throw new Error(err)
        }
        console.log(result)

    })
}
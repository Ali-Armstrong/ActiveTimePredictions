// var redis = require('redis');
// var client = redis.createClient(6379, '192.168.1.169');
// lua_scripts = require('redis-lua')("/scripts")
// client.on('connect', function() {
//     console.log('connected');
// });
// lua_scripts(redis)
// var uId=1;
// var clId=2;
// var key=clId+':'+uId
// client.sadd([key,'wait','school','u3'],function (err,reply) {
//     console.log(reply);
//
// });

// client.zadd(key, 'NX', 0,'some',function (err,reply) {
//     console.log(reply)
//
// })
// client.smembers(key,function (err,reply) {
//     console.log(reply);
//
// });

var arr = ["10", "30023", "18", "28219", "19", "21991", "11", "35053", "22", "6901", "20", "14968", "12", "44477", "6", "1490", "0", "1329", "21", "11027", "5", "607", "14", "59588", "13", "54471", "8", "7207", "17", "39636", "9", "19849", "15", "61643", "16", "53982", "7", "2888", "1", "617", "3", "298", "2", "336", "4", "329"]

function prepareObjsArray(arr) {
    var objsArray = []
    for (var i = 0; i < arr.length;) {
        var obj = {}
        obj["hour"] = arr[i]
        obj["count"] = arr[i + 1];
        objsArray.push(obj)
        i = i + 2;
    }
    return objsArray
}
function sortByCount(objsArray) {
    objsArray.sort(function (a, b) {
        return parseFloat(b.count) - parseFloat(a.count);
    });
    return objsArray
}
function sortByHour(objsArray) {
    objsArray.sort(function (a, b) {
        return parseFloat(a.hour) - parseFloat(b.hour);
    });
    return objsArray
}
// console.log(prepareObjsArray(arr))
var objsArray=prepareObjsArray(arr)
var sortedByCount=sortByCount(objsArray)
console.log("byCount\n",sortedByCount)
var sortedByHour=sortByHour(objsArray)
console.log("byHour\n",sortedByHour)
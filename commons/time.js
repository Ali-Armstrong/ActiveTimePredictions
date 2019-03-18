var Time = function () {
}
var method = Time.prototype
method.getNPreviousDateStamp = function (n) {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }

    var dateStamp = Date.parse(year + "-" + month + "-" + day + " 00:00:00") - (n * 86400000);
    return dateStamp;
};
module.exports = Time;

// var Time = require("./time.js");
// var time = new Time();
// console.log(time.getNPreviousDateStamp(0))
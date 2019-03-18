var MongoClient = require('mongodb').MongoClient;
exports.createMongoConnection = function (opts, callback) {
    if (!callback) {
        callback = function () {
        }
    }
    if (!opts) {
        return callback("opts orgument should not be null");
    }
    if (!opts.host || !opts.port || !opts.database) {
        return callback("invalid opts:" + JSON.stringify(opts));
    }
    var url;
    if (opts.auth) {
        if (!opts.username || !opts.password) {
            return callback("invalid opts:" + JSON.stringify(opts));
        }
        url = 'mongodb://' + opts.username + ":" + opts.password + "@" + opts.host + ':' + opts.port + '/'
            + opts.database;
    }
    else {
        url = 'mongodb://' + opts.host + ':' + opts.port + '/'
            + opts.database;
    }
    console.log(url)
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        if (!db) {
            return callback("some thing went wrong");
        }

        callback(null, db);
    })
};


var request = require("request");
var events = require('events');
var eventEmitter = new events.EventEmitter();

var Dmp = function (redis_conn) {
    if (!redis_conn) {
        throw new Error("invalid redis connection");
    }
    var me = this;
    me.redis_conn = redis_conn;
    me.config = {
        "url": "http://209.58.136.24:8000",
        "login": {
            email: "analyticsdata@dmp.io",
            password: "aNaLyTiCs24",
            req: "/api/Clients/login?"
        },
        "idByemail": {
            "req": "/api/Services/aero/email?email="
        },
        "emailById": {
            "req": "/api/Services/aero/email?id="
        }
    }
};

var method = Dmp.prototype;


method.login = function (callback) {
    var me = this;
    request({
        method: "POST",
        url: me.config.url + me.config.login.req,
        json: true,
        body: {
            "email": me.config.login.email,
            "password": me.config.login.password
        }
    }, function (err, response) {
        if (err) {
            throw new Error(err)
        }
        if (response.statusCode === 400 || response.statusCode === 401) {
            throw new Error("Error in posting record" + JSON.stringify(response.body));
        }
        else if (response.statusCode === 200 || response.statusCode === 202 || response.statusCode === 201) {
            if (response.body && response.body.id) {
                // console.log("Access Token is ", response.body.id);
                var accessToken = response.body.id
                callback(accessToken);
            } else {
                throw new Error("dmp login error");
            }
        }
        else {
            throw new Error("dmp login error--" + JSON.stringify(response));
        }
    });
};

method.loadAccessTokenFromRedis = function (cb) {
    var me = this;
    r_client = me.redis_conn;
    r_client.hget("UATP_AccessTokens", "UATP_Dmp", function (err, res) {
        if (err) {
            throw new Error(err)
        } else {
            return cb(res)
        }
    });
};

method.accessTokenCheck = function (cb) {
    var me = this;
    if (me.accessToken) {
        return cb();
    }
    me.loadAccessTokenFromRedis(function (token) {
        if (token) {
            me.accessToken = token;
            return cb();
        }
        me.refreshAccessToken(cb)
    })

};

method.refreshAccessToken = function (cb) {
    var me = this;
    if (me.gettingAccessToken) {
        return eventEmitter.once('gotToken', cb);
    }
    me.gettingAccessToken = true;
    me.redis_conn.hdel("UATP_AccessTokens", "UATP_Dmp", function (err, res) {
        if (err)
            throw new Error(err);
        me.login(function (token) {
            me.accessToken = token;
            me.redis_conn.hset("UATP_AccessTokens", "UATP_Dmp", token, function (err, res) {
                if (err)
                    throw new Error(err)
                eventEmitter.emit('gotToken');
                me.gettingAccessToken = false;
                return cb();
            });
        });
    })
};

method.getEmailById = function (id, cb) {
    var me = this;
    me.accessTokenCheck(function () {
        var url = me.config.url + me.config.emailById.req + id + "&access_token=" + me.accessToken
        request({
            url: url,
            method: "GET",
            json: true
        }, function (err, response) {
            if (err) {
                cb(new Error(err).stack)
            }
            if (response.statusCode === 400 || response.statusCode === 401 || response.statusCode === 500) {
                if (/*JSON.stringify(response.body.error.message).indexOf('Authorization Required') > -1*/ response.statusCode === 401) {
                    //to avoid asynchronous logins... make login only once...
                    me.refreshAccessToken(function () {
                        me.getEmailById(id, cb)
                    });
                }
                else {
                    cb(new Error("something went wrong with dmp http request, access token is right\n" + JSON.stringify(response.body) + "\nurl:" + url).stack);
                }
            }
            else if (response.statusCode === 200 || response.statusCode === 201) {
                var email = response.body.data.email
                if (!email) {
                    cb(new Error("invalid email from dmp..").stack)
                }
                cb(null, email);
            } else {
                cb(new Error("something went wrong" + JSON.stringify(response)).stack);
            }
        })
    });
};

method.getIdByEmail = function (email, cb) {
    var me = this
    me.accessTokenCheck(function () {
        var url = me.config.url + me.config.idByemail.req + email + "&access_token=" + me.accessToken;
        request({
            url: url,
            method: "GET",
            json: true
        }, function (err, response) {
            if (err) {
                return cb(new Error(err).stack)
            }
            if (response.statusCode === 400 || response.statusCode === 401 || response.statusCode === 500) {
                if (/*JSON.stringify(response.body.error.message).indexOf('Authorization Required') > -1*/ response.statusCode === 401) {
                    //to avoid asynchronous logins... make login only once...
                    me.refreshAccessToken(function () {
                        me.getEmailById(id, cb)
                    });
                }
                else {
                    return cb(new Error("something went wrong with dmp http request, access token is right\n" + JSON.stringify(response.body) + "\nurl:" + url).stack);
                }
            }
            else if (response.statusCode === 200 || response.statusCode === 201) {
                var id = response.body.data.id
                if (!id) {
                    return cb(new Error("invalid id from dmp..for "+ email + JSON.stringify(response) + "\n" + me.accessToken).stack)
                }
                cb(null, id);
            } else {
                cb(new Error("something went wrong" + JSON.stringify(response)).stack);
            }
        })
    });
};
module.exports = Dmp;
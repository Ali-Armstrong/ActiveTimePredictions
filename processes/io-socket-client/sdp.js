/* Created by sys1036 on 28/2/17.*/
"use strict";
//send data programmatically(sdp)
const config = require('./config');
const WebSocket = require('ws');
const events = require('events');
const logger = require('tracer').console({
  format: "{{timestamp}} [{{title}}] {{message}} (in {{path}}:{{line}})",
  dateformat: "dd-mm-yyyy HH:MM:ss TT"
});

var pingInterval = 5000;

function wrapper_send() {
  var myEmitter = new events.EventEmitter();
  myEmitter.setMaxListeners(0);

  var IP = config.socket_send.host
      , PORT = config.socket_send.port
      , WS_URL = "ws:" + IP + ":" + PORT;

  const authAttemptLimit = 5, retryTimeInSec = 1 * 1000;

  var msg, verified, invalidData, successAck, serverError, loginMsg, authEventId;
  var registerInvalidFlag = true, socketStatus = false, regCallback = false, logInFlag = false;
  var attemptAuthCounter = 0, objExp = {};

  var wsc;

  main();

  function main() {
    wsc = new WebSocket(WS_URL, {
      perMessageDeflate: false
    });

    wsc.on("error", function (err) {
      logger.log("ERROR CONNECTING SERVER :: \n", err);
    });

    wsc.on('open', function () {
      // logger.info("A socket connection established.");
      socketStatus = true;
    });

    wsc.on('message', function incoming(message) {
      try {
        msg = JSON.parse(message);
        if (msg.verify) {
          verified = true;
          loginMsg = {
            code: 'SUCCESS'
          };
          myEmitter.emit('authOnSend');
        }
        else if (msg.verify === false) {
          verified = false;
          loginMsg = {
            code: msg.error
          };
          myEmitter.emit('authOnSend');
        }
        if (msg.invalidAck || msg.successAckn || msg.MQ_ERROR) {
          invalidData = msg.invalidAck;
          if (msg.MQ_ERROR) {
            serverError = msg.MQ_ERROR;
          }
          if (msg.successAckn !== null) {
            successAck = msg.successAckn;
          }
          else {
            successAck = "success";
          }
          myEmitter.emit('acknowledgement');
        }
      }
      catch (err) {
        logger.error(err);
      }
    });
    logger.debug(WS_URL);
  }

  function closeCon() {
    wsc.close();
  }

  function checkCon(callback) {
    if (socketStatus) {
      return callback(true);
    }
    return callback(false);
  }

  function authenticate(username, password, callback) {
    // logger.info("Authenticate @ sdp.js. socketStatus :: ", socketStatus);
    if (socketStatus) {
      logInFlag = true;
      var msg = JSON.stringify({username: username, password: password});
      sendFunc(msg, function (err, res) {
        if (err) {
          logger.error(err);
        }
      });
      myEmitter.once('authOnSend', function () {
        if (verified) {
          return callback(loginMsg);
        }
        else {
          return callback(loginMsg);
        }
      });
    }
    else {
      if (!authEventId) {
        // logger.info("socketStatus value is ", socketStatus, ". Waiting for retry");
        authEventId = setInterval(function () {
          if (logInFlag) {
            clearInterval(authEventId);
          }
          else if (attemptAuthCounter >= authAttemptLimit) {
            logger.error("Maximum retries reached");
            loginMsg = {code: "MAX_RETRIES_REACHED"};
            clearInterval(authEventId);
            return callback(loginMsg);
          }
          else {
            attemptAuthCounter++;
            authenticate(username, password, callback);
          }
        }, retryTimeInSec);
      }
      else {
        logger.info("Already registered for authentication retry");
      }
    }
  }

  function registerCallback(sendData, callback) {
    if (sendData === 'SEND_DATA') {
      regCallback = true;
    }
    if (registerInvalidFlag) {
      registerInvalidFlag = false;
      myEmitter.on('acknowledgement', function () {
        if (invalidData) {
          var ack = invalidData;
        }
        if (successAck) {
          var ack = successAck;
        }
        if (serverError) {
          var ack = serverError;
        }
        return callback(ack);
      });
    }
  }

  function sendData(data) {
    if (regCallback) {
      var msg = JSON.stringify({chunk: JSON.stringify(data)});
      sendFunc(msg, function (err, res) {
        if (err) {
          logger.error(err);
        }
      });
    }
    else {
      logger.log("Callback Not registered for sendData");
    }
  }

  function sendFunc(message, callback) {
    if (logInFlag) {
      wsc.send(message, function ack(err) {
        if (err) {
          return callback("Socket connection failed");
        }
        return callback(null, "sent");
      });
    }
    else {
      return callback("You are not Authenticated ");
    }
  }

  function socketConnectionListener(callback) {
    var listenerId = setInterval(function () {
      wsc.send(JSON.stringify({"ping": true}), function ack(err) {
        if (err) {
          var brokenPipe = {
            "code": "BROKEN_PIPE",
            "msg": "Socket Connection Lost"
          };
          clearInterval(listenerId);
          return callback(brokenPipe);
        }
      });
    }, pingInterval);
  }

  objExp.authenticate = authenticate;
  objExp.registerCallback = registerCallback;
  objExp.sendData = sendData;
  objExp.main = main;
  objExp.sendFunc = sendFunc;
  objExp.checkCon = checkCon;
  objExp.closeCon = closeCon;
  objExp.socketConnectionListener = socketConnectionListener;

  return objExp;
}

function wrapper_receive() {
  var myEmitter = new events.EventEmitter();
  myEmitter.setMaxListeners(0);

  var IP = config.socket_receive.host
      , PORT = config.socket_receive.port
      , WS_URL = "ws:" + IP + ":" + PORT;

  const authAttemptLimit = 5, retryTimeInSec = 30 * 1000;

  var msg, verified, serve, notification, getDataFun, loginMsg, statusReq, domainCount, authEventId;
  var locked = false, socketStatus = false, logInFlag = false;
  var objExp = {}, attemptAuthCounter = 0;

  var wsc;

  main();

  function main() {
    wsc = new WebSocket(WS_URL, {
      perMessageDeflate: false
    });

    wsc.on("error", function (err) {
      logger.log("ERROR CONNECTING SERVER :: \n", err);
    });

    wsc.on('open', function () {
      // logger.info("A socket connection established.");
      socketStatus = true;
    });

    wsc.on('message', function incoming(message) {
      try {
        msg = JSON.parse(message);
        if (msg.verify) {
          verified = true;
          loginMsg = {
            code: 'SUCCESS'
          };
          myEmitter.emit('authOnReceive');
        }
        else if (msg.verify === false) {
          verified = false;
          loginMsg = {
            code: msg.error
          };
          myEmitter.emit('authOnReceive');
        }
        if (msg.process === "SERVING") {
          serve = msg;
          myEmitter.emit('serveData');
        }
        if (msg.process === "DATA_ALLOTMENT" && msg.type === "NOTIFICATION") {
          notification = msg;
          myEmitter.emit('notify');
        }
        if (msg.process === "REQUEST_STATUS") {
          statusReq = msg;
          myEmitter.emit('reqStatus');
        }
        if (msg.process === 'GET_DOMAIN_COUNT') {
          domainCount = msg;
          myEmitter.emit('domainCountEvent');
        }
      }
      catch (err) {
        logger.error(err);
      }
    });
    logger.debug(WS_URL);
  }

  function closeCon() {
    wsc.close();
  }

  function checkCon(callback) {
    if (socketStatus) {
      return callback(true);
    }
    return callback(false);
  }

  function authenticate(username, password, callback) {
    if (socketStatus) {
      logInFlag = true;
      var msg = JSON.stringify({username: username, password: password});
      sendFunc(msg, function (err, res) {
        if (err) {
          logger.log(err);
        }
      });
      myEmitter.once('authOnReceive', function () {
        if (verified) {
          return callback(loginMsg);
        }
        else {
          return callback(loginMsg);
        }
      });
    }
    else {
      if (!authEventId) {
        // logger.info("socketStatus value is ", socketStatus, ". Waiting for retry");
        authEventId = setInterval(function () {
          if (logInFlag) {
            clearInterval(authEventId);
          }
          else if (attemptAuthCounter >= authAttemptLimit) {
            logger.error("Maximum retries reached");
            loginMsg = {code: "MAX_RETRIES_REACHED"};
            clearInterval(authEventId);
            return callback(loginMsg);
          }
          else {
            attemptAuthCounter++;
            authenticate(username, password, callback);
          }
        }, retryTimeInSec);
      }
      else {
        logger.info("Already registered for authentication retry");
      }
    }
  }

  function reqNotification(callback) {
    var msg = JSON.stringify({notifyClient: true});
    sendFunc(msg, function (err, res) {
      if (err) {
        logger.log("socket error @ req notification-module");
      }
    });
    logger.log("****** Callback registered for Notifications ******");
    logger.log("****** Wait for a while for Notifications ******");
    myEmitter.on('notify', function () {
      callback(notification);
    });
  }

  function serveDataFun() {
    if (serve) {
      locked = false;
      console.log("coming here");
      return getDataFun(serve);
    }
  }

  function getData(reqId, getCount, callback) {
    getDataFun = callback;
    // logger.log(" >>>> data req received for reqId:: ", reqId);
    // logger.log("lock status ::", locked);
    if (!locked) {
      locked = true;
      var msg = JSON.stringify({reqData: true, reqId: reqId, getCount: getCount});
      sendFunc(msg, function (err, res) {
        if (err) {
          logger.log(err);
        }
      });
    }
    else {
      logger.log("your previous request not served");
    }
  }

  function getDataWithoutAck(reqId, getCount, callback) {
    getDataFun = callback;
    // logger.log(" >>>> data req received for reqId:: ", reqId);
    // logger.log("lock status ::", locked);
    if (!locked) {
      locked = true;
      var msg = JSON.stringify({reqDataWithoutAck: true, reqId: reqId, getCount: getCount});
      sendFunc(msg, function (err, res) {
        if (err) {
          logger.log(err);
        }
      });
    }
    else {
      logger.log("your previous request not served");
    }
  }

  function sendFunc(message, callback) {
    if (logInFlag) {
      wsc.send(message, function ack(err) {
        if (err) {
          return callback("Socket connection failed");
        }
        return callback(null, "sent");
      });
    }
    else {
      return callback("You are not Authenticated");
    }
  }

  function reqStatus(reqID, callback) {
    var msg = JSON.stringify({"reqId": reqID, reqStatus: true});
    sendFunc(msg, function (err, res) {
      if (err) {
        logger.log(err);
      }
    });
    myEmitter.once('reqStatus', function () {
      return callback(statusReq);
    });
  }

  myEmitter.on('serveData', function () {
    serveDataFun();
  });

  function getDomainCount(reqID, callback) {
    var msg = JSON.stringify({"reqId": reqID, getDomainCount: true});
    sendFunc(msg, function (err, res) {
      if (err) {
        logger.log(err);
      }
    });
    myEmitter.once('domainCountEvent', function () {
      if (domainCount.status === 'FAILURE') {
        return callback(domainCount);
      }
      else {
        return callback(null, domainCount)
      }
    });
  }

  function sendAckForReceivedData(reqID, recCount, callback) {
    var msg = JSON.stringify({"ackForReqData": true, "receivedCount": recCount, "reqId": reqID});
    wsc.send(msg, function ack(err) {
      if (err) {
        return callback("Error Sending Ack");
      }
    });
    return callback(null, "Ack Sent");
  }

  function socketConnectionListener(callback) {
    var listenerId = setInterval(function () {
      wsc.send(JSON.stringify({"ping": true}), function ack(err) {
        if (err) {
          var brokenPipe = {
            "code": "BROKEN_PIPE",
            "msg": "Socket Connection Lost"
          };
          clearInterval(listenerId);
          return callback(brokenPipe);
        }
      });
    }, pingInterval);
  }

  objExp.authenticate = authenticate;
  objExp.reqNotification = reqNotification;
  objExp.serveDataFun = serveDataFun;
  objExp.getData = getData;
  objExp.getDataWithoutAck = getDataWithoutAck;
  objExp.reqStatus = reqStatus;
  objExp.sendFunc = sendFunc;
  objExp.checkCon = checkCon;
  objExp.closeCon = closeCon;
  objExp.main = main;
  objExp.getDomainCount = getDomainCount;
  objExp.sendAckForReceivedData = sendAckForReceivedData;
  objExp.socketConnectionListener = socketConnectionListener;
  return objExp;
}

function getSendSocket() {
  var sendSocketObj = wrapper_send();
  return sendSocketObj;
}

function getReceiveSocket() {
  var receiveSocketObj = wrapper_receive();
  return receiveSocketObj;
}

var exportObj = {
  getMeASendSocketConn: getSendSocket,
  getMeAReceiveSocketConn: getReceiveSocket
};

module.exports = exportObj;
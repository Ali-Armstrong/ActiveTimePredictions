/**
 * Created by sys1036 on 10/5/17....
asdfasdf*/
const mainSdp = require('./sdp');
const logger = require('tracer').console({
  format: "{{timestamp}} [{{title}}] {{message}} (in {{path}}:{{line}})",
  dateformat: "dd-mm-yyyy HH:MM:ss TT"
});

function wrapper_send() {
  var sdp, mainExp = {};

  getAnSdp();

  function getAnSdp() {
    sdp = mainSdp.getMeASendSocketConn();
  }

  function authenticate(username, password, callback) {
    logger.info("In sdp Trying to authenticate for :: ", username, password);
    sdp.authenticate(username, password, function (res) {
      if (res.code === 'SUCCESS') {
        res.msg = 'Connection Successful';
        return callback(null, res);
      }
      else {
        if (res.code.code === 'SERVER_SIDE_ERROR') {
          return callback(res.code);
        }
        else if (res.code === 'USER_NOT_FOUND') {
          res.msg = 'No user found with the given email';
          return callback(res);
        }
        else if (res.code === 'INVALID_PASSWORD') {
          res.msg = 'email & password doesn’t match';
          return callback(res);
        }
        else if (res.code === 'MAX_RETRIES_REACHED') {
          res.msg = 'Maximum retries reached. Try again';
          return callback(res);
        }
        else {
          logger.error("Error authenticating for %s & %s . response :: ", username, password, res.code);
        }
      }
    });
  }

  function registerCallback(callback) {
    sdp.registerCallback('SEND_DATA', function (ack) {
      if (ack.Error) {
        return callback(ack);
      }
      return callback(null, ack);
    });
  }

  function sendData(data) {
    sdp.sendData(data);
  }

  function closeSocket() {
    "use strict";
    sdp.closeCon();
  }

  function socketConnectionListener(callback) {
    sdp.socketConnectionListener(function (broken) {
      return callback(broken);
    });
  }

  mainExp.authenticate = authenticate;
  mainExp.closeSocket = closeSocket;
  mainExp.registerCallback = registerCallback;
  mainExp.sendData = sendData;
  mainExp.socketConnectionListener = socketConnectionListener;

  return mainExp;
}

function wrapper_receive() {
  var sdp, mainExp = {};

  getAnRdp();

  function getAnRdp() {
    sdp = mainSdp.getMeAReceiveSocketConn();
  }

  function authenticate(username, password, callback) {
    logger.info("In sdp Trying to authenticate for :: ", username, password);
    sdp.authenticate(username, password, function (res) {
      if (res.code === 'SUCCESS') {
        res.msg = 'Connection Successful';
        return callback(null, res);
      }
      else {
        if (res.code.code === 'SERVER_SIDE_ERROR') {
          return callback(res.code);
        }
        else if (res.code === 'USER_NOT_FOUND') {
          res.msg = 'No user found with the given email';
          return callback(res);
        }
        else if (res.code === 'INVALID_PASSWORD') {
          res.msg = 'email & password doesn’t match';
          return callback(res);
        }
        else if (res.code === 'MAX_RETRIES_REACHED') {
          res.msg = 'Maximum retries reached. Try again';
          return callback(res);
        }
        else {
          logger.error("Error authenticating for %s & %s . response :: ", username, password, res.code);
        }
      }
    });
  }

  function closeSocket() {
    "use strict";
    sdp.closeCon();
  }

  function reqNotification(callback) {
    sdp.reqNotification(function (notification) {
      return callback(notification);
    });
  }

  function getData(reqId, getCount, callback) {
    sdp.getData(reqId, getCount, function (data) {
      if (data.status.toUpperCase() === 'FAILURE') {
        return callback(data);
      }
      return callback(null, data);
    });
  }

  function getDataWithoutAck(reqId, getCount, callback) {
    sdp.getDataWithoutAck(reqId, getCount, function (data) {
      if (data.status.toUpperCase() === 'FAILURE') {
        return callback(data);
      }
      return callback(null, data);
    });
  }

  function sendAckForReceivedData(reqId, receivedCount, callback) {
    sdp.sendAckForReceivedData(reqId, receivedCount, function (err, res) {
      return callback(err, res);
    });
  }

  function reqStatus(reqID, callback) {
    sdp.reqStatus(reqID, function (res) {
      return callback(res);
    });
  }

  function getDomainCount(reqID, callback) {
    sdp.getDomainCount(reqID, function (err, res) {
      callback(err, res);
    });
  }

  function socketConnectionListener(callback) {
    sdp.socketConnectionListener(function (broken) {
      return callback(broken);
    });
  }

  mainExp.authenticate = authenticate;
  mainExp.closeSocket = closeSocket;
  mainExp.reqNotification = reqNotification;
  mainExp.getData = getData;
  mainExp.getDataWithoutAck = getDataWithoutAck;
  mainExp.sendAckForReceivedData = sendAckForReceivedData;
  mainExp.reqStatus = reqStatus;
  mainExp.getDomainCount = getDomainCount;
  mainExp.socketConnectionListener = socketConnectionListener;

  return mainExp;
}

function getSendConnection() {
  var send = wrapper_send();
  return send;
}

function getReceiveConnection() {
  var receive = wrapper_receive();
  return receive;
}

var exportObj = {
  getSendDataConnection: getSendConnection,
  getReceiveDataConnection: getReceiveConnection
};

module.exports = exportObj;

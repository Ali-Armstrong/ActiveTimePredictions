/**
 * Created by sys1036 on 2/9/17.
 */
const config = require('./config');
const package = require('./package.json');
const WebSocket = require('ws');
const logger = require('tracer').console({
  format: "{{timestamp}} [{{title}}] {{message}} (in {{path}}:{{line}})",
  dateformat: "dd-mm-yyyy HH:MM:ss TT"
});
const fs = require('fs');

var IP = config.socket_send.host
    , PORT = config.socket_send.port
    , WS_URL = "ws:" + IP + ":" + PORT;
var VERSION = package.version;

// console.log(VERSION, WS_URL);

var wsc = new WebSocket(WS_URL, {
  perMessageDeflate: false
});

wsc.on("error", function (err) {
  logger.log("ERROR CONNECTING SERVER :: \n", err);
});

var updateObj = {
  "updateRequest": true,
  "version": VERSION
};

wsc.on('open', function () {
  wsc.send(JSON.stringify(updateObj), function ack(err) {
    if (err)
      logger.error("ERROR ::", err);
  });
});

function writeModule(contents) {
  var successCounter = 0;
  fs.writeFile('./sdp.js', contents.sdp, 'utf8', function (err) {
    if (err) {
      logger.err("Error updating SDP");
    }
    else {
      successCounter++;
      // logger.log("sdp updated Successfully");
    }
  });
  fs.writeFile('./main.js', contents.main, 'utf8', function (err) {
    if (err) {
      logger.err("Error updating main");
    }
    else {
      successCounter++;
      // logger.log("main updated Successfully");
    }
  });
  fs.writeFile('./config.js', contents.config, 'utf8', function (err) {
    if (err) {
      logger.err("Error updating config");
    }
    else {
      successCounter++;
      // logger.log("config updated Successfully");
    }
  });
  fs.writeFile('./package.json', contents.package, 'utf8', function (err) {
    if (err) {
      logger.err("Error updating package");
    }
    else {
      successCounter++;
      // logger.log("package updated Successfully");
    }
  });
  var successID = setInterval(function () {
    if (successCounter === 4) {
      console.log("Client Module updated successfully");
      clearInterval(successID);
      wsc.close();
    }
  }, 0);
}

wsc.on('message', function incoming(message) {
  try {
    var msgUpdate = JSON.parse(message);
    // console.log(contents.package);
    if (msgUpdate.status === 'ERROR') {
      if (msgUpdate.code === 'MODULE_UPTODATE') {
        console.log(msgUpdate.msg);
      }
      else if (msgUpdate.code === 'ERROR_UPDATING') {
        console.log("Error while updating ::\n", msgUpdate.msg);
      }
      else {
        logger.error("unknown response from server", msgUpdate);
      }
      wsc.close();
    }
    else {
      writeModule(msgUpdate.contents);
    }
  }
  catch (err) {
    logger.error("ERROR at Catch :: ", err);
  }
});

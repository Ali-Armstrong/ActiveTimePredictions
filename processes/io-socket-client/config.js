var config = {};

config.socket_send = {
   // host:"209.58.136.24",
  //host: "103.18.248.31",//test
    host: "10.29.0.176",//live
    port: "1300" //live
  //port: "5501"//test
    //port:"1400"
};

config.socket_receive = {
  //host: "103.18.248.31",//test
  host: "10.29.0.176",//live
  port: "1126" //live
  //port: "5501"//test
};

config.creds = {
  email: "",
  pwd: ""
};

module.exports = config;
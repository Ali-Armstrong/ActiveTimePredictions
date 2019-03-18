/*var request = require("request");

 var access_token = "FLPxKVglOkIB1eBPt0WDTAV8WgmttnjrBUigwAq2gERFl6kAt2cpzeOuMEihF4IM";
 //to get email by id
 var Url = "http://209.58.136.24:8000/api/Services/aero/email?id="
 var Id = 1;
 var tempUrl= Url+Id+"&access_token="+accessToken;


 //to get ID by email
 var Url = "http://209.58.136.24:8000/api/Services/aero/email?email="
 var emailId = "michael.mastrile@gmail.com"
 var tempUrl= Url+emailId+"&access_token="+accessToken;

 email
 request(tempUrl, { json: true },function (err,res,body) {
 if(err){
 console.log(err);
 }
 else{
 //for email by id
 console.log(body.data.email);
 //for id by email
 console.log(body.data.id);
 }
 });



 url for login:
 http://209.58.136.24:8000/api/Clients/login?
 json type, post method
 body:{
 "email":"emailAddress",
 "password":"pswd"
 }

 return object
 get object.id =====> access_token;



 */
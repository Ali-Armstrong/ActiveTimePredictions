/**
 * Created by sys1108 on 11/12/17.
 */
'use strict';
var runningEnv = process.argv[2];
var configuration = require("../../config/" + runningEnv + "/config.json")
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoConnector = require("../../commons/mongoConnection.js");
const nodemailer = require('nodemailer');
var async = require('async');
var schedule = require('node-schedule');

var db;

schedule.scheduleJob({hour: 9 , minute: 15}, function(){
    mongoConnector.createMongoConnection(configuration.mongodb, function (err, db1) {
        if (err) {
            throw new Error(err);
        }
        console.log("Mongo Connection Succeessfull");
        db = db1;
        start()
    });
});

var text2='<div dir="ltr"><table cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none"><colgroup><col width="100"><col width="125"><col width="138"><col width="100"><col width="100"><col width="100"><col width="171"><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"></colgroup><tbody><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:right;border:1px solid rgb(204,204,204)">"$$Date$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);font-weight:bold;text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">with time</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);font-weight:bold;text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="4">on time</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);font-weight:bold;text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="4">out of time</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;font-family:arial;font-weight:bold;border:1px solid rgb(204,204,204)">Total delivers</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">$$block1$$</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:right;border:1px solid rgb(204,204,204)">$$block2$$</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);border:1px solid rgb(204,204,204)">$$block3$$%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);text-align:right;border:1px solid rgb(204,204,204)" rowspan="1" colspan="3">$$block4$$</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);border:1px solid rgb(204,204,204)">$$block5$$%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);text-align:right;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">$$block6$$</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);border:1px solid rgb(204,204,204)">$$block7$$%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);border:1px solid rgb(204,204,204)"></td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">on time</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">off time</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">on time</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);text-align:center;border:1px solid rgb(204,204,204)" rowspan="1" colspan="2">off time</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;font-weight:bold;border:1px solid rgb(204,204,204)">Reactions</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;text-align:center;border:1px solid rgb(204,204,204)">$$block8$$</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);text-align:right;border:1px solid rgb(204,204,204)">"$$block9$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(217,234,211);border:1px solid rgb(204,204,204)">"$$block10$$"%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);text-align:right;border:1px solid rgb(204,204,204)">"$$block11$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);border:1px solid rgb(204,204,204)">"$$block12$$"%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:right;border:1px solid rgb(204,204,204)">"$$block13$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)">"$$block14$$"%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)"></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);text-align:right;border:1px solid rgb(204,204,204)">"$$block23$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(147,196,125);border:1px solid rgb(204,204,204)">"$$block24$$"%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);text-align:right;border:1px solid rgb(204,204,204)">"$$block25$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(208,224,227);border:1px solid rgb(204,204,204)">"$$block26$$"%</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)" rowspan="4" colspan="6"><div style="max-height:84px"></div></td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">1/2hr to 1h delay</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:right;border:1px solid rgb(204,204,204)">"$$block15$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)">"$$block16$$"%</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;border:1px solid rgb(204,204,204)" rowspan="4" colspan="4"><div style="max-height:84px"></div></td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">1hr to 2h delay</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:right;border:1px solid rgb(204,204,204)">"$$block17$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)">"$$block18$$"%</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">2hr to 3h delay</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:right;border:1px solid rgb(204,204,204)">"$$block19$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)">"$$block20$$"%</td></tr><tr style="height:21px"><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:center;border:1px solid rgb(204,204,204)">more than 3h delay</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);text-align:right;border:1px solid rgb(204,204,204)">"$$block21$$"</td><td style="overflow:hidden;padding:2px 3px;vertical-align:bottom;background-color:rgb(244,204,204);border:1px solid rgb(204,204,204)">"$$block22$$"%</td></tr></tbody></table></div>'
//text=text.replace('$$Date$$','Dec 10')
//console.log(text)


function start(){
    //console.log(yesterday.getTime())
    var text=text2;
    var today=new Date();
    today.setHours(0,0,0,0);
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);
    yesterday.setHours(0,0,0,0);
    var dd = yesterday.getDate();
    var mm = yesterday.getMonth()+1; //January is 0!

    var yyyy = yesterday.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }
    if(mm<10){
        mm='0'+mm;
    }
    var dateformat = dd+'/'+mm+'/'+yyyy;
    console.log(dateformat);
    text=text.replace('$$Date$$',dateformat);

    console.log(yesterday.getTime()/1000);

    async.parallel({
        one: function(parallelCb) {
            //console.log('one')
            db.collection(configuration.mongodb.UATP_monitor_stats).findOne({
                "date":yesterday.getTime()
            },function (err, result) {
                //console.log(result)
                if (err) {
                    throw new Error(err)
                } else {
                    //console.log(result)
                    parallelCb(null,result)
                }
            });
        },
        two: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:1}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        three: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:2}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        four: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:2,iOoR:1}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        five: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:2,iOoR:2}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        six: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:2,dl:{$gt:0.3,$lt:1}}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        seven: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:2,dl:{$gte:1,$lt:2}}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        eight: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:2,dl:{$gte:2,$lt:3}}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },
        nine: function (parallelCb) {
            db.collection(configuration.mongodb.UATP_ts_log).count({dlT:{$gte:(yesterday.getTime()/1000),$lt:(today.getTime()/1000)},iOoDl:1,iOoR:2,dl:{$gte:3}}, function(error, numOfDocs) {
                if(error)
                    throw new Error(error)
                parallelCb(null,numOfDocs)
            });
        },



    }, function(err, results) {
       // console.log(results.one)
        var num;
        text=text.replace("$$block1$$",results.one.hits);

        text=text.replace("$$block2$$",results.one.predictedHits);

        num=(results.one.predictedHits/results.one.hits)*100;
        if(isNaN(num))
            num=0
        text=text.replace("$$block3$$",Math.round(num * 100)/100);

        text=text.replace("$$block4$$",results.one.pftHits);

        num=(results.one.pftHits/results.one.predictedHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace("$$block5$$",Math.round(num * 100)/100);

        text=text.replace("$$block6$$",results.one.outHits);

        num=(results.one.outHits/results.one.predictedHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace("$$block7$$",Math.round(num * 100)/100);

        text=text.replace("$$block8$$",results.one.reacts);

        text=text.replace('"$$block9$$"',(results.two+results.three+results.four+results.five));
        //console.log(results.two+results.three+results.four+results.five)

        num=((results.two+results.three+results.four+results.five)/results.one.predictedHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block10$$"',Math.round(num * 100)/100);


        text=text.replace('"$$block11$$"',results.two);

        num=(results.two/results.one.pftHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block12$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block13$$"',results.three);

        num=(results.three/results.one.pftHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block14$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block15$$"',results.six);

        num=(results.six/results.three)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block16$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block17$$"',results.seven);

        num=(results.seven/results.three)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block18$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block19$$"',results.eight);

        num=(results.eight/results.three)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block20$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block21$$"',results.nine);

        num=(results.nine/results.three)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block22$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block23$$"',results.four);

        num=(results.four/results.one.outHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block24$$"',Math.round(num * 100)/100);

        text=text.replace('"$$block25$$"',results.five);

        num=(results.five/results.one.outHits)*100;
        if(isNaN(num))
            num=0
        text=text.replace('"$$block26$$"',Math.round(num * 100)/100);

        sendEmail(text)

    });
}
function sendEmail(stats) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: configuration.mail.senderEmail,
            pass: configuration.mail.senderPass
        }
    });

    let mailOptions = {
        from: configuration.mail.senderEmail, // sender address
        to: configuration.mail.tolist,
        inReplyTo:'<78518f0e-7bb8-d0ca-c37c-f2959dc48f2c@gmail.com>',
        subject: 'UATP_Stats ✔', // Subject line
        html: stats // html body
    };


    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

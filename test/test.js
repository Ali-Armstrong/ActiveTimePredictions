// var events = require('events');
// var tmtMsgAckEventEmiter = new events.EventEmitter();
// tmtMsgAckEventEmiter.setMaxListeners(0);
// var flag = false;
// var i = 0, j = 0;
// setInterval(function () {
//     if (!flag) {
//         if (i === 10) {
//             tmtMsgAckEventEmiter.emit("hai", true);
//             flag = true;
//         }
//         tmtMsgAckEventEmiter.once("hai", function (ack) {
//             if (ack) {
//                 console.log("At ack State", j);
//                 hai(++j);
//             }
//         });
//         ++i;
//     } else {
//         console.log("After Completer of event", j);
//         hai(++j);
//
//     }
//
// }, 1000);
//
// function hai(i) {
//     console.log(i);
// }


// var events = require('events');
// var tmtMsgAckEventEmiter = new events.EventEmitter();
// tmtMsgAckEventEmiter.setMaxListeners(0);
// var isBinding = true;
// var bindedEvent = "binded";
// var i = 0;
// setTimeout(function () {
//     isBinding = false;
//     tmtMsgAckEventEmiter.emit(bindedEvent);
// }, 4000)
// function consume(msg) {
//     if (isBinding) {
//         tmtMsgAckEventEmiter.once(bindedEvent, function () {
//             console.log("pushed to tmta", msg);
//         });
//     }
//     else {
//         console.log("pushed to tmta", msg);
//     }
// }
//
// while (i < 5) {
//     consume(i);
//     i++;
// }
//
// setTimeout(function () {
//     while (i < 11) {
//         consume(i);
//         i++;
//     }
// }, 6000)
/*
var tempresArry = [{id: 4, term: "t1"}, {id: 3, term: "t3"}, {id: 5, term: "t5"}]
var resArry = [];
var refObj = {}
for (var i = 0; i < tempresArry.length; i++) {
    var obj = tempresArry[i]
    resArry.push(obj);
    var index = resArry.length - 1;
    refObj[obj.id] = index
}
var dbArry = [{id: 3, term: "t3", desc: "t3desc"}, {id: 4, term: "t1", desc: "t4desc"}, {
    id: 5,
    term: "t5",
    desc: "t5desc"
}]

for (var i = 0; i < dbArry.length; i++) {
    var dbObj = dbArry[i]
    resArry[refObj[dbObj.id]].desc = dbObj.desc
}
console.log(resArry)
var slotPreBuffer = 0.30

var r=matchReactionTimes(13.4,[{"f":0.2,"t":23.5}]);
console.log(r);

function matchReactionTimes(rTime, hstTimes) {
    var frac_fd,frac_fi,frac_td,frac_ti,deci_f,deci_t;
    for (var i in hstTimes) {
        var slot = hstTimes[i];
        //console.log(slot.f)
        slot.f=parseFloat(slot.f);
        slot.t=parseFloat(slot.t);
        deci_f=parseFloat(parseFloat(slot.f-Math.floor(slot.f)).toFixed(2));
        deci_t=parseFloat(parseFloat(slot.t-Math.floor(slot.t)).toFixed(2));
        if(deci_f<0.3){
            frac_fd=(0.6-(0.3-deci_f));
            frac_fi=(Math.floor(slot.f))-1;
            if(frac_fi<0)
                frac_fi=23;
            slot.f=frac_fi+frac_fd;
        }else
            slot.f-=0.3;
        if(deci_t>=0.3){
            frac_td=(deci_t-0.3);
            frac_ti=(Math.floor(slot.t))+1;
            if(frac_ti>=24)
                frac_ti=0;
            slot.t=frac_ti+frac_td;
        }else
            slot.t+=0.3;
        console.log(slot.f,slot.t);

        if (rTime >= slot.f && rTime <= slot.t) {
            return 1;
        }
    }
    return 2;
}

msg={
    "openTime":1512707424
}

dataprocess(msg)
function dataprocess(msg) {
    var time = parseInt(msg.openTime);
    var date = new Date(time * 1000);
    var d = date.getDay() + 1;
    var spl;
    if (d == 1) {
        spl = 2;
    } else {
        spl = 1;
    }
    var h = date.getHours();
    var m = date.getMinutes();

    if (m < 10) {
        m = '0' + m;
    }
    console.log(m,h+parseFloat(m))
    var t = parseFloat(h + '.' + m);
    console.log(parseFloat(10.10))
    var tm = {
        "t": t,
        "d": parseInt(msg.openTime)
    };
    console.log(tm,d)
}*/
/*
times=[
    {
        "s" : 4,
        "t" : 1.4,
        "f" : 0.2
    },
    {
        "s" : 3,
        "t" : 4.2,
        "f" : 3.2
    }
]
timebuffer=0.3;
var temp=matchReactionTimes(1.5,times)
console.log(temp)
function matchReactionTimes(rTime, hstTimes) {
    var frac_fd,frac_fi,frac_td,frac_ti,deci_f,deci_t;
    var min=24;
    for (var i in hstTimes) {
        //console.log(hstTimes[i].t);
        var slot = JSON.stringify(hstTimes[i]);
        slot=JSON.parse(slot);
        //console.log(slot.f)
        slot.f=parseFloat(slot.f);
        slot.t=parseFloat(slot.t);
        if(slot.f>0.3) {
            deci_f = parseFloat(parseFloat(slot.f - Math.floor(slot.f)).toFixed(2));
            deci_t = parseFloat(parseFloat(slot.t - Math.floor(slot.t)).toFixed(2));
            if (deci_f < timebuffer) {
                frac_fd = (0.6 - (timebuffer - deci_f));
                frac_fi = (Math.floor(slot.f)) - 1;
                if (frac_fi < 0)
                    frac_fi = 23;
                slot.f = frac_fi + frac_fd;
            } else
                slot.f -= timebuffer;
        }
        if(slot.t<23.3){
            if (deci_t >= timebuffer) {
                frac_td = (deci_t - timebuffer);
                frac_ti = (Math.floor(slot.t)) + 1;
                if (frac_ti >= 24)
                    frac_ti = 0;
                slot.t = frac_ti + frac_td;
            } else
                slot.t += timebuffer;
        }
        //console.log(rTime,slot.f,slot.t,hstTimes[i].t);
        if (rTime >= slot.f && rTime <= slot.t) {
            return [1,0]
        }else{
            if(rTime-parseFloat(hstTimes[i].t)>0&&min>rTime-parseFloat(hstTimes[i].t)){
                //console.log("diff",rTime,hstTimes[i].t)
                rTime=parseFloat(Math.round(rTime * 100) / 100).toFixed(2);
                hstTimes[i].t=parseFloat(Math.round(hstTimes[i].t * 100) / 100).toFixed(2);
                min=diff(hstTimes[i].t,rTime)

            }

        }
    }

    return [2,parseFloat(min)]
}

//var temp=diff("1.4","2.2")
//console.log(temp)
function diff(start, end) {
    start = start.split(".");
    end = end.split(".");
    var startDate = new Date(0, 0, 0, start[0], start[1], 0);
    var endDate = new Date(0, 0, 0, end[0], end[1], 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);

    return (hours < 9 ? "0" : "") + hours + "." + (minutes < 9 ? "0" : "") + minutes;
}*/
/*
var schedule = require('node-schedule')

var text2="abcdefghijklmnopqrstuvwxyz";

schedule.scheduleJob({}, function(){
    console.log(text2)
    start()
});

function start(){
    text=text2;
    text=text.replace("b","s");
    console.log(text);
}*/
// var DmpApi = require("../commons/dmpApi.js")
// var dmp = new DmpApi();
//
// getId('mahamdali.s@gmail.com',function (err,res) {
//    if(err)
//        console.log(err)
//    else
//        console.log(res)
// });
//
// function getId(id, cb) {
//     //console.log(id)
//     dmp.getIdByEmail(id, cb)
// }


var events = require('events');
var eventEmitter = new events.EventEmitter();
var wait=1;
function rotate(i) {
    if(i>=10){
        return;
    }
    if(wait){
        wait=0;
        setTimeout(function(){
            console.log('completes')
            eventEmitter.emit('complete')
        }, 3000);

    }else{
        //console.log('comes')
        eventEmitter.once('complete',function () {
            console.log('else',i)
        });
    }
    setImmediate(function () {
        i++;
        rotate(i)
    })
}
rotate(0)

setTimeout(function () {
    eventEmitter.emit('complete')
},5000)

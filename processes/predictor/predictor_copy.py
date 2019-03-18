#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Nov  6 09:43:36 2017

@author: sys1108
"""

from numpy import array, linspace
from sklearn.neighbors.kde import KernelDensity
from scipy.signal import argrelextrema
from datetime import datetime, date, time, timedelta
from pymongo import MongoClient
import time as time1

import schedule
import numpy as np
import time as time1
import math
import redis
import sys
import json

import os
import sys
import json

path = "../../config/" + sys.argv[1]

with open(os.path.join(path, 'config.json')) as data_file:
    data = json.load(data_file)

# mongodb://root:pass@localhost:27017/
if data["redis"]["auth"]:
    redis_db = redis.StrictRedis(host=data["redis"]["host"], port=data["redis"]["port"], db=data["redis"]["db"],
                                 password=data["redis"]["password"])
else:
    redis_db = redis.StrictRedis(host=data["redis"]["host"], port=data["redis"]["port"], db=data["redis"]["db"])

# a = array([10,11,9,23,21,11,45,20,11,12]).reshape(-1, 1)
client = MongoClient(data["mongodb"]["uri"])

dayob = []
hour = []

db = client[data["mongodb"]["database"]]
collection = db[data["mongodb"]["collection1"]]
collection2 = db[data["mongodb"]["collection2"]]
collection3 = db[data["mongodb"]["collection3"]]
collection5 = db[data["mongodb"]["collection5"]]

counts = {
    "inserted": 0,
    "updated": 0,
    "notimeinterval": 0
}


def getWeekDay():
    today = datetime.datetime.today().weekday() + 2
    if (today > 7):
        today = 1
    return today


def userActiveTimes():
    while 1:
        t = time1.time()
        # print(db,collection)
        weekDay = getWeekDay()
        docs = collection.find(
            {"status": {"$exists": False}, "dmpEmId": {"$exists": True}, "day": {"$ne": weekDay}}).limit(500)
        # count=docs.count()
        # print("find time",time1.time()-t)
        # if not count:
        #     print('waiting for records')
        #     time1.sleep(300)
        # else:
        isGotResult = False
        for doc in docs:
            isGotResult = True
            dum = []
            for i in range(len(doc["opens"])):
                dum.append(doc["opens"][i]["t"])
            t1 = time1.time()
            timeintervals = KDE(dum)
            print("predicter function time:", time1.time() - t1)
            if timeintervals:
                savePredictions(doc['dmpEmId'], doc['day'], timeintervals)
            else:
                counts['notimeinterval'] += 1;
            collection.update_one({"_id": doc['_id'], "status": {"$exists": False}},
                                  {"$set": {'status': 2}}, upsert=False)
        updatecounts()
        if not isGotResult:
            print('waiting for records')
            time1.sleep(300)


def savePredictions(emid, day, lis):
    timings = []
    i = 0
    # print(type(lis[i]))
    if type(lis[i]) == float or type(lis[i]) == int:
        tmp = {}
        tmp['f'] = lis[0]
        tmp['t'] = lis[len(lis) - 1]
        tmp['s'] = len(lis)
        timings.append(tmp)
    else:
        for i in range(len(lis)):
            tmp = {}
            print(lis[i])
            tmp['f'] = float(lis[i][0])
            tmp['t'] = float(lis[i][len(lis[i]) - 1])
            tmp['s'] = len(lis[i])
            timings.append(tmp)
    savecounts(timings, day)
    doc2 = collection2.update_one({"dmpEmId": emid, "day": day}, {"$set": {"slots": timings, "status": 1}},
                                  upsert=False)
    if doc2.modified_count == 0:
        res = redis_db.hincrby('UATP_ids', 'UATP_RealPredictions__id', amount=1)
        res = int(res)
        try:
            # print(res)
            t4 = time1.time()
            collection2.insert_one(
                {
                    "_id": res,
                    "dmpEmId": emid,
                    "day": day,
                    "slots": timings
                }
            )
            print("insertion time: ", time1.time() - t4)
            counts['inserted'] += 1;

        except:
            t5 = time1.time()
            collection2.update_one({"dmpEmId": emid, "day": day}, {"$set": {"slots": timings, "status": 1}},
                                   upsert=False)
            print("updation time:", time1.time() - t5)
    else:
        counts['updated'] += 1;


def KDE(lst):
    result = []
    lst2 = []
    lst.sort()
    if len(lst) > 1:
        for i in range(len(lst)):
            f, w = math.modf(lst[i])
            lst2.append(round(w + (f / 0.6), 2))
        a = array(lst2).reshape(-1, 1)
        kde = KernelDensity(kernel='gaussian', bandwidth=0.45).fit(a)
        s = linspace(0, 24)
        e = kde.score_samples(s.reshape(-1, 1))
        mi = argrelextrema(e, np.less)[0]
        if (len(mi) > 0):
            for i in range(len(mi) + 1):
                if i == 0:
                    temp = a[a < s[mi[i]]]
                elif i == len(mi):
                    temp = a[a >= s[mi[i - 1]]]
                else:
                    temp = a[(a >= s[mi[i - 1]]) * (a <= s[mi[i]])]
                if (len(temp) > 1):
                    for i in range(len(temp)):
                        f, w = math.modf(temp[i])
                        temp[i] = round(w + (f * 0.6), 2)
                    result.append(temp)
            return result
        else:
            return lst
    else:
        return 0


def savecounts(timings, sday):
    found = 0
    found2 = 0
    global dayob
    global hour
    for j in range(len(timings)):
        # print(int(timings[j]['f']), int(timings[j]['t']))
        slotarr = []
        fromT = int(timings[j]['f'])
        toT = int(timings[j]['t'])
        if (fromT == toT):
            slotarr.append(fromT)
        else:
            slotarr.append(fromT)
            slotarr.append(toT)
        for k in slotarr:
            for l in range(len(dayob)):
                if dayob[l]["day"] == sday:
                    if dayob[l]["hour"] == k:
                        dayob[l]["count"] += 1
                        found = 1
            if not found:
                x = {}
                x["day"] = sday
                x["hour"] = k
                x["count"] = 1
                dayob.append(x)
            for m in range(len(hour)):
                if hour[m]["hour"] == k:
                    hour[m]["count"] += 1
                    found2 = 1
            if not found2:
                z = {}
                z["hour"] = k
                z["count"] = 1
                hour.append(z)
                # print(dayob, hour)
                # key='UATP_counts_'+str(int(timings[j]['f']))
                # redis_db.hincrby('UATP_ids',key,amount=1)


def updatecounts():
    # print(day)
    # print(hour)
    global dayob
    global hour
    for i in range(len(dayob)):
        collection5.update_one({"day": dayob[i]["day"], "hour": dayob[i]["hour"]},
                               {"$inc": {"counts": dayob[i]["count"]}}, upsert=True)
    for i in range(len(hour)):
        collection5.update_one({"day": {"$exists": False}, "hour": hour[i]["hour"]},
                               {"$inc": {"counts": hour[i]["count"]}}, upsert=True)
    dayob = []
    hour = []


userActiveTimes()

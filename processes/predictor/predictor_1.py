#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Nov  6 09:43:36 2017

@author: sys1108
"""
from __future__ import division

from numpy import array, linspace
from sklearn.neighbors.kde import KernelDensity
from scipy.signal import argrelextrema
from datetime import datetime, date, time, timedelta
from pymongo import MongoClient

import numpy as np
import time as time1
import math
import redis
import operator
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
    today = datetime.today().weekday() + 2
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
            dum2=[]
            for i in range(len(doc["opens"])):
                past={}
                date=datetime.fromtimestamp(doc["opens"][i]["d"]).strftime('%d')
                p=int(date)//7
                if int(date)%7>0:
                    p+=1
                past['b']=p
                past['t']=doc["opens"][i]["t"]
                dum.append(past)
                dum2.append(doc["opens"][i]["t"])
            t1 = time1.time()
            timeintervals = KDE(dum2,dum)
            print("predicter function time:", time1.time() - t1)
            if timeintervals:
                savePredictions(doc['dmpEmId'], doc['day'], timeintervals)
            else:
                counts['notimeinterval'] += 1;
            collection.update_one({"_id": doc['_id'], "status": {"$exists": False}},
                                  {"$set": {'status': 2}}, upsert=False)
        if not isGotResult:
            print('waiting for records')
            time1.sleep(300)


def savePredictions(emid, day, lis):
    timings=[]
    if type(lis[0]) is dict:
        tmp={}
        score=0
        lis = sorted(lis, key=operator.itemgetter('t'))
        for j in range(len(lis)):
            score+=1/lis[j]['b']
        tmp['f'] = float(lis[0]['t'])
        tmp['t'] = float(lis[len(lis) - 1]['t'])
        tmp['s'] = round(score,2)
        timings.append(tmp)
    else:
        for i in range(len(lis)):
            tmp={}
            score=0
            lis[i] = sorted(lis[i], key=operator.itemgetter('t'))
            for j in range(len(lis[i])):
                score+=1/lis[i][j]['b']
            tmp['f'] = float(lis[i][0]['t'])
            tmp['t'] = float(lis[i][len(lis[i]) - 1]['t'])
            tmp['s'] = round(score,2)
            timings.append(tmp)
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
    print(counts)



def KDE(lst,dum):
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
        mi=s[mi]
        if (len(mi) > 0):
            for k in range(len(mi)+1):
                if k == 0:
                    result.append(list(filter(lambda i: i['t']<mi[k],dum)))
                elif k == len(mi):
                    result.append(list(filter(lambda i: i['t']>=mi[k-1],dum)))
                else:
                    result.append(list(filter(lambda i: i['t']>=mi[k-1] and i['t']<mi[k],dum)))
            return result
        else:
            return dum
    else:
        return 0


userActiveTimes()

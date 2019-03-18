# import os
# import sys
# '''pwd=os.getcwd()
#
#
# os.chdir(path)
#
# filecontents=open(os.path.join(path,'config.json')).read()'''
# path="../../config/"+sys.argv[1]
# import json
# from pprint import pprint
#
# with open(os.path.join(path,'config.json')) as data_file:
#     data = json.load(data_file)


#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Dec 18 15:08:16 2017

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
            print(result)
        else:
            print(lst)
    else:
        print('no')


KDE([9.2,10.3,11.4,12.20])
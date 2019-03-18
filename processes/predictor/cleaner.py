from datetime import datetime,date,time,timedelta
import schedule
import time as time1

from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client.local
collection = db.January

schedule.every().day.at("00:01").do(removeRecords)

while 1:
    schedule.run_pending()
    time1.sleep(1)

removeRecords()
    
def removeRecords():
    tm = datetime.combine(date.today(), time.min)
    tm = tm + timedelta(days=-60)
    tm=int(tm.timestamp())
    while 1:
        doc=collection.find_and_modify(query={"opens":{"$elemMatch":{"d": {"$lt":tm}}}},update={"$pull": {"opens":{"d":{"$lt":tm}}}}, upsert=False)
        if not doc:
            print("process done...")
            break
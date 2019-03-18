'''
import schedule
import _thread
import time

# Define a function for the thread
def print_time( threadName, delay):
    def removeRecords():
        print('hi')
    schedule.every().day.at("12:32").do(removeRecords)
    while 1:
        schedule.run_pending()
        time.sleep(1)

def hello(threadName,delay):
    print('hello')
    while 1:
        time.sleep(delay)

# Create two threads as follows
try:
    _thread.start_new_thread( print_time, ("Thread-1", 2, ) )
    _thread.start_new_thread( hello, ("Thread-2", 60, ) )
except:
    print ("Error: unable to start thread")

while 1:
    pass'''
# import threading
# import time
# import schedule
#
# def function1():
#     def removeRecords():
#         print('hi')
#     schedule.every().day.at("13:02").do(removeRecords)
#     while 1:
#         schedule.run_pending()
#         time.sleep(1)
#
# def hello():
#     print('hello')
#     while 1:
#         time.sleep(100)
#
#
# threading.Thread(target=function1).start()
# threading.Thread(target=hello).start()

import socket
import time
s = socket.socket()
port = 12345
s.connect(('192.168.5.241', port))
while True:
    print(s.recv(1024))
    time.sleep(1)
s.close()


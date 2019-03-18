# ActiveTimePredictions
Aim of this project is to predict the user active timings in upcoming days using the large amount of past data that we already have
The data pushed through rabbit mq. so there is a preprocessing files which initially get the data from rabbit mq, preprocess the
data in to our required format and store the data into mongodb all these processes are written in Node.js.
After preprocessing is done. we will do the prediction process. where we use KDE (Kernel Density Estimation) model in python which
will read the data from mongodb and make some predictions and store those predictions again in mongodb

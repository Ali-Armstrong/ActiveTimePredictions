var fs = require('fs')
var filepath="test.csv";
fs.open(filepath, 'r', function(err, fd) {
    fs.fstat(fd, function(err, stats) {
        var bufferSize=stats.size,
            chunkSize=512,
            buffer=new Buffer(bufferSize),
            bytesRead = 0;

        while (bytesRead < bufferSize) {
            if ((bytesRead + chunkSize) > bufferSize) {
                chunkSize = (bufferSize - bytesRead);
            }
            fs.read(fd, buffer, bytesRead, chunkSize, bytesRead);
            bytesRead += chunkSize;
        }
        console.log(buffer.toString('utf8', 0, bufferSize));
        fs.close(fd);
    });
});
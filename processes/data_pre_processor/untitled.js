var lazy=require("lazy");
var fs=require('fs')
    
    var s=fs.createReadStream('testData.csv')

    new lazy(s)
        .lines
        .skip(4990)
        .forEach(function(line){
            
            console.log(line.toString());
            s.pause()
        }
    );
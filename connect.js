// var redis = require('redis');

// var sub = redis.createClient('172.19.0.2', 8001);
// var pub = redis.createClient('172.19.0.3', 8002);

// sub.on("message", function(channel, message) {
//     console.log(channel, message)
// })

// sub.subscribe("mychannel")

// pub.publish("mychannel", "1")
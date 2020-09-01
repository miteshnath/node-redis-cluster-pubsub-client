var redis_pubsub = require("./index")({
  createClient: function (host, port) {
    var redis = require("redis");

    return redis.createClient(port, host);
  },
  nodes: [
    { host: "172.19.0.2", port: 8001 },
    { host: "172.19.0.3", port: 8002 },
    { host: "172.19.0.4", port: 8003 },
  ],
});

redis_pubsub.on("message", function (channel, message) {
  console.log(channel, message);
});

redis_pubsub.subscribe("my_test_channel");

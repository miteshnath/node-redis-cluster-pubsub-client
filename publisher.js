var redis_pubsub = require("./index")({
  createClient: function (host, port) {
    // pass a redis client
    var redis = require("redis"); // only clients with the same method signatures

    return redis.createClient(port, host);
  },
  nodes: [
    // the list of hosts in your cluster to use pub/sub
    { host: "172.19.0.2", port: 8001 },
    { host: "172.19.0.3", port: 8002 },
    { host: "172.19.0.4", port: 8003 },
  ],
});

let i = 0;
while (true) {
  i = i + 1;
  redis_pubsub.publish("my_test_channel", i.toString());
  if (i === 2) {
    break;
  }
}

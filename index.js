var EventEmitter = require("events").EventEmitter;

/**
 * @param options.createClient Required.
 * @param options.nodes Required.
 * @constructor
 */
function RedisClientWrapper(options) {
  if (typeof options.createClient != "function") {
    throw new Error("options.createClient is required");
  }

  if (!options) {
    throw new Error("options is required");
  }

  var $ = this;
  var nodes = options.nodes;
  var redisClients = []; //active_nodes
  var emitter = new EventEmitter();
  var subscriber = null;
  var nextSubscriber = null;
  var publisher = null;

  nodes.forEach(function (node) {
    console.log("node: ", node);
    let client = options.createClient(node.host, node.port);
    redisClients.push(client);
    client.on("ready", function () {
      console.log("ready: ", node.host);
      client.__ready__ = true;
    });

    client.on("error", function () {
      // remove the dead redis from active_nodes
      const index = redisClients.indexOf(client);
      console.log("error : ", client.options.host);
      if (index > -1) {
        redisClients.splice(index, 1);
      }
    });
  });

  $.subscribe = function (channel) {
    setImmediate(function () {
      let client = getSuitableRedisClient(channel);
      if (client) {
        subscriber = client;
        subscriber.on("ready", function () {
          if (nextSubscriber) {
            // unsubscribe since the original node is up again
            nextSubscriber.unsubscribe(channel);
            console.log("channel %s removed from node %s", channel, nextSubscriber.options.host)
            nextSubscriber = null;
          }
        });
        subscriber.subscribe(channel);
        console.log("channel %s on node %s", channel, subscriber.options.host)
        subscriber.on("message", function (channel, message) {
          emitter.emit("message", message);
        });

        subscriber.on("error", function (error) {
          if (redisClients.length > 0) {
            client = getSuitableRedisClient(channel);
            console.log("active clients : %s", redisClients.length);
            if (!nextSubscriber) {
              nextSubscriber = client;
              // original node seems done, so subscribe on new node
              nextSubscriber.subscribe(channel);
              console.log("channel %s moved node %s", channel, nextSubscriber.options.host)
              nextSubscriber.on("message", function (channel, message) {
                emitter.emit("message", message);
              });
            }
          }
        });
      }
    });
  };

  $.publish = function (channel, message) {
    let redisPub = getSuitableRedisClient(channel);
    console.log("publisher node : ", redisPub.options.host);
    publisher = redisPub;
    if (redisPub) {
      redisPub.once("ready", function () {
        publisher.publish(channel, message);
        console.log("published to node : ", publisher.options.host);
      });
      redisPub.once("error", function (error) {
        let nextRedisPub = getSuitableRedisClient(channel);
        if ((nextRedisPub, options.host !== publisher.options.host)) {
          publisher = nextRedisPub;
        }
        publisher.publish(channel, message);
        console.log("published to node : ", nextRedisPub.options.host);
      });
    }
  };

  $.on = function (event, callback) {
    if (event === "message") {
      emitter.on(event, callback);
    } else {
      throw new Error("Only 'message' is supported");
    }
  };

  function getSuitableRedisClient(channel) {
    // basically length of channel string modulus number of active node as hash function to select correct node.
    let selectedNode = channel.length % redisClients.length;
    console.log(
      "redisClients length, channel length: ",
      redisClients.length,
      channel.length
    );

    return redisClients[selectedNode];
  }
}

module.exports = function (options) {
  return new RedisClientWrapper(options);
};

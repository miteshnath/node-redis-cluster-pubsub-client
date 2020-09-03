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
  var redisClients = [];
  var emitter = new EventEmitter();
  var subscriber = null;
  var nextSubscriber = null;
  var publisher = null;

  nodes.forEach(function (node) {
    console.log("node: ", node);
    let client = options.createClient(node.host, node.port);
    redisClients.push(client);
    client.on("ready", function () {
      console.log("inside node ready : ", node.host);
      client.__ready__ = true;
    });

    client.on("error", function () {
      const index = redisClients.indexOf(client);
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
            nextSubscriber.unsubscribe(channel);
            nextSubscriber = null;
          }
        });
        subscriber.subscribe(channel);
        subscriber.on("message", function (channel, message) {
          emitter.emit("message", message);
        });

        subscriber.on("error", function (error) {
          if (redisClients.length > 0) {
            client = getSuitableRedisClient(channel);
            console.log(client.options.host, subscriber.options.host);
            console.log("inside");
            if (!nextSubscriber) {
              nextSubscriber = client;
              nextSubscriber.subscribe(channel);
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
    console.log("publisher: ", redisPub.options.host);
    publisher = redisPub;
    if (redisPub) {
      redisPub.once("ready", function () {
        publisher.publish(channel, message);
        console.log("published: ", publisher.options.host);
      });
      redisPub.once("error", function (error) {
        let nextRedisPub = getSuitableRedisClient(channel);
        if ((nextRedisPub, options.host !== publisher.options.host)) {
          publisher = nextRedisPub;
        }
        publisher.publish(channel, message);
        console.log("published: ", nextRedisPub.options.host);
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

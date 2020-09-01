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

  var redis_clients = [];

  var emitter = new EventEmitter();

  var first_available, redisPub;

  nodes.forEach(function (node) {
    var redisClient = options.createClient(node.host, node.port);

    redis_clients.push(redisClient);

    redisClient.on("ready", function () {
      redisClient.__ready__ = true;
      if (!first_available) {
        first_available = redisClient;
      }
    });

    redisClient.on("error", function () {
      console.log("nodes: ", nodes);
      console.log("---------------");

      const index = redis_clients.indexOf(redisClient);
      if (index > -1) {
        redis_clients.splice(index, 1);
      }

      const idx = nodes.indexOf(node);
      if (idx > -1) {
        nodes.splice(idx, 1);
      }
    });
  });

  $.subscribe = function (channel) {
    setImmediate(function () {
      redis_clients.forEach(function (client) {
        client.subscribe(channel);
        client.on("message", function (message) {
          emitter.emit("message", message);
        });
      });
    });
  };

  $.publish = function (channel, message) {
    console.log(channel, message)
    if (!redisPub) {
      redisPub = getFirstAvailableRedisClient();
    }

    redisPub.publish(channel, message);
  };

  $.on = function (event, callback) {
    if (event === "message") {
      emitter.on(event, callback);
    } else {
      throw new Error("Only 'message' is supported");
    }
  };

  function getFirstAvailableRedisClient() {
    for (let i = 0; i < redis_clients.length; i++) {
      return redis_clients[i];
    }
  }
}

module.exports = function (options) {
  return new RedisClientWrapper(options);
};

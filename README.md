# node-redis-cluster-pubsub-client
This repo contains basic nodejs pubsub client for redis cluster 


## Assumptions: A linux system with docker is provided. 

To get the clusters up and running, make the `create-redis-cluster.sh` executable and run the sh file.

It is currently configured to start 3 redis containers 
(setup of handshake protocols b/w them to form a cluster is commented out) 

Docker compose can also be used for this setup, not included right now here. 

I used latest redis image,without redis-sentinel. 
sentinel can be used for master-slave leader election and quorum, 
bitnami redis-cluster images are also good alternative.

`running.sh` create script will echo all the redis node IPs and ports but they can be found later using following.

Below should fetch the IP of `redis-node-1`, to fetch ip of other nodes replace the node-name like `redis-node-2`.

``docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-node-1  
``

Once IPs of nodes are known, use the pub-sub node client provided in index.js. 

Examples of publisher and subscriber are written in publisher.js and subscriber.js respectively.

`node subscriber.js 
` 

`node publisher.js
` 

Basically subscriber/publisher is chosen by `channel.length % active_nodes.length`

once, if the subscribed node is down, the channel is subscribed to new node  using `active_nodes.length`. For example, say channel length is 15 and active nodes are 3 then subscriber listens on 0th index of active_nodes(redisClients in index.js). now it the 0th node goes down after sometime, error event handles setup of new subscriber node. 15%2 ie the 1st index of active_clients (now of reduced size 2). once the old node is up again it is again reshuffled to and put on old node of 0th index (active_node size 3 now).

publisher also follows logic on same grounds.
Actually it is not necessary to publish on the same node if the cluster is talking on gossip channel. But current cluster is not setup so. (can be done by uncommenting few lines in create cluster script).

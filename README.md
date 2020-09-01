# node-redis-cluster-pubsub-client
This repo contains basic nodejs pubsub client for redis cluster 


#Assumptions: A linux system with docker is provided. \

To get the clusters up and runing, make the `create-redis-cluster.sh` and run the sh file.\
It is currently configured to start 3 redis containers and setup handshake protocols b/w them to form a cluster. 
Docker compose can also be used for this setup. \

I used latest redis image,without redis-sentinel. \
sentinel can be used for master-slave leader election and quorum, \
bitnami redis-cluster images are also good alternative.

on running .sh create script it will echo all the redis node IPs and ports but below can be used to find them later\
Below should fetch the IP of redis-node-1, to fetch ip if other nodes replace the node-name like redis-node-2 \
``docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-node-1  
``\
Once IPs of nodes are know, one can use the pub-sub node client provided in index.js. 
Example publisher and subscriber are written in publisher.js and subscriber.js respectively.

`node subscriber.js 
` \
`node publisher.js
` \

To handle failure of nodes in cluster during pubsub, I basically subscribed to the channel on each node. \
Publisher still publishes to on availabe redis node in cluster and then internally node passes it on to other nodes on gossip channel.\

This is not very scalable as subscribes are way more than need. \
Ideally there should be a service discovery which keeps track of available redis nodes. and client talks to this service discovery to get available node to subscribe to channels. Some other methods can also be used. I just created a bare minimum.

This client doesnt handle redis features other than pubsub(like get, set..), but cluster will support redis features with any other clients like 'ioredis'

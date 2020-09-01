#!/usr/bin/env bash

docker network create red_cluster
docker pull redis

for ind in $(seq 1 3); do
    docker run -d \
        --name "redis-node-$ind" \
        --net red_cluster \
        -v $PWD/"800$ind"/redis.conf:/usr/local/etc/redis/redis.conf redis redis-server /usr/local/etc/redis/redis.conf
done

REDIS_NODE_IP_1=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-node-1)
REDIS_NODE_IP_2=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-node-2)
REDIS_NODE_IP_3=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-node-3)

echo "REDIS_NODE_IP_1:  " $REDIS_NODE_IP_1 "PORT 8001" 
echo "REDIS_NODE_IP_2:  " $REDIS_NODE_IP_2 "PORT 8002" 
echo "REDIS_NODE_IP_3:  " $REDIS_NODE_IP_3 "PORT 8003" 

redis-cli -h $REDIS_NODE_IP_1 -p 8001 cluster meet $REDIS_NODE_IP_2 8002
redis-cli -h $REDIS_NODE_IP_1 -p 8001 cluster meet $REDIS_NODE_IP_3 8003

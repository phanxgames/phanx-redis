const Multi = require("redis").Multi;
const RedisClient = require("redis").RedisClient;

/** Fixes incomplete type definition in @types/redis for Multi class **/

class MultiMiddleLayer extends Multi {
    constructor(client,args) {
        super(client,args);
    }
}
exports.MultiMiddleLayer = MultiMiddleLayer;

class RedisMiddleLayer extends RedisClient {
    constructor(config) {
        super(config);
    }

    pxscan(...rest) {
        this.scan(...rest);
    }

}
exports.RedisMiddleLayer = RedisMiddleLayer;

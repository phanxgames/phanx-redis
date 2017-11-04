const Multi = require("redis").Multi;
const RedisClient = require("redis").RedisClient;

/** Fixes incomplete type definition in @types/redis for Multi class **/

class MultiFix extends Multi {
    constructor(client,args) {
        super(client,args);
    }
}
exports.MultiFix = MultiFix;

class RedisFix extends RedisClient {
    constructor(config) {
        super(config);
    }

    pxscan(...rest) {
        this.scan(...rest);
    }

}
exports.RedisFix = RedisFix;

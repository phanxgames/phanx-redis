/** Fixes incomplete type definition in @types/redis for Multi class **/

import {RedisClient} from "redis";

export const MultiFix: {
    new (client:any,args): any;
};
export const RedisFix: {
    new (config:any):RedisFix;
};
export interface RedisFix extends RedisClient{
    pxscan(...rest):any;
}
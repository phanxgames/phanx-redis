/** Fixes incomplete type definition in @types/redis for Multi class **/

import {Callback, RedisClient} from "redis";

export const MultiMiddleLayer: {
    new (client:any,args): any;
};
export const RedisMiddleLayer: {
    new (config:any):RedisMiddleLayer;
};
export interface RedisMiddleLayer extends RedisClient{
    pxscan(...rest):any;

    //hack until @types/redis has the callback fix, pull request
    hgetall(key: string,
            cb?: Callback<{ [key: string]: string }>):any;
}
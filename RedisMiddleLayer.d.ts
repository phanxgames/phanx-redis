/** Fixes incomplete type definition in @types/redis for Multi class **/

import {Callback, ClientOpts, Commands, Multi, RedisClient, ServerInfo} from "redis";
import EventEmitter = NodeJS.EventEmitter;
import {Duplex} from "stream";

export const MultiMiddleLayer: {
    new (client:any,args): any;
};
export const RedisMiddleLayer: {
    new (config:any):RedisMiddleLayer;
};


export interface RedisMiddleLayer extends Commands<any>, EventEmitter {

    pxscan(...rest):any;

    /*
    //hack until @types/redis has the callback fix, pull request
    hgetall(key: string,
            cb?: Callback<{ [key: string]: string }>):any;
    */

    connected: boolean;
    command_queue_length: number;
    offline_queue_length: number;
    retry_delay: number;
    retry_backoff: number;
    command_queue: any[];
    offline_queue: any[];
    connection_id: number;
    server_info: ServerInfo;
    stream: Duplex;

    on(event: 'message' | 'message_buffer', listener: (channel: string, message: string) => void): this;
    on(event: 'pmessage' | 'pmessage_buffer', listener: (pattern: string, channel: string, message: string) => void): this;
    on(event: 'subscribe' | 'unsubscribe', listener: (channel: string, count: number) => void): this;
    on(event: 'psubscribe' | 'punsubscribe', listener: (pattern: string, count: number) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    /**
     * Client methods.
     */

    end(flush?: boolean): void;
    unref(): void;

    cork(): void;
    uncork(): void;

    duplicate(options?: ClientOpts, cb?: Callback<RedisClient>): RedisClient;

    sendCommand(command: string, cb?: Callback<any>): boolean;
    sendCommand(command: string, args?: any[], cb?: Callback<any>): boolean;
    send_command(command: string, cb?: Callback<any>): boolean;
    send_command(command: string, args?: any[], cb?: Callback<any>): boolean;

    /**
     * Mark the start of a transaction block.
     */
    multi(args?: Array<Array<string | number | Callback<any>>>): Multi;
    MULTI(args?: Array<Array<string | number | Callback<any>>>): Multi;

    batch(args?: Array<Array<string | number | Callback<any>>>): Multi;
    BATCH(args?: Array<Array<string | number | Callback<any>>>): Multi;
}
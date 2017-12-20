import { RedisMiddleLayer } from "./RedisMiddleLayer";
import { Dictionary } from "dictionaryjs";
export declare class PhanxRedis extends RedisMiddleLayer {
    /**
     * Set to false to not throw errors, use .error to check if not null.
     * By default its true: meaning you need to wrap with try/catch.
     */
    throwErrors: boolean;
    /**
     * Contains the last operation's error or null if none.
     */
    error: Error;
    /**
     * Contains the last operation's result.
     */
    result: any;
    constructor(config?: object);
    /**
     * Attempts to look for a key and if its null return the default
     *   parameter.
     *
     * @param key - key to lookup
     * @param defaultValue - default value if its not found
     * @param {Function} cb
     * @returns {Promise<any>}
     */
    getDefault(key: any, defaultValue: any, cb?: Function): Promise<any>;
    /**
     * Sets an object to key by converting it to json first.
     *
     * @param key - key to set
     * @param obj - value to set
     * @param {Function} cb - (optional) - cb(err, result)
     * @returns {Promise<any>}
     */
    setJson(key: any, obj: any, cb?: Function): Promise<any>;
    /**
     * Get key from server and automatically parse as json.
     *
     * @param key - key to lookup
     * @param {Function} cb - (optional) - cb(err:Error,result:Object)
     * @returns {Promise<any>}
     */
    getJson(key: any, cb?: Function): Promise<any>;
    /**
     * Searches for all keys that match the search.
     * cbIterator may be used to return one row at a time.
     * Or you may get a Dictionary (dictionaryjs) collection
     *   returned from the promise if you don't set cbIterator.
     * Note: setting the cbIterator will result in no Dictionary
     *   creation.
     *
     * <pre>
     *     let result:Dictionary = await redis.getSearch("key.*");
     * </pre>
     *
     * @param {string} search - key search
     * @param {Function} cbIterator - (optional) - cb(key,data,cbNext)
     * @param {Function} cbFinal - (optional) - cb(err)
     * @returns {Promise<Dictionary<any,any>>}
     */
    getSearch(search: string, cbIterator?: Function, cbFinal?: Function): Promise<Dictionary<any, any>>;
    /**
     * Searches through database and deletes all keys that match the search.
     * <pre>
     *     let count = await redis.delSearch("key.*");
     * </pre>
     *
     * @param {string} search - key search string
     * @param {Function} cbFinal - (optional) - cb(err:Error,delCount:number)
     * @returns {Promise<any>}
     */
    delSearch(search: string, cbFinal?: Function): Promise<any>;
    private __setupMethods();
    private _setMapping(command);
    private _multiMapper(commandUpper);
    private _mapperMethod(functionRef);
    private _handleCallback(resolve, reject, err, result?);
}

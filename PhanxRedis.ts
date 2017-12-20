
import * as commands from "redis-commands";
import {MultiMiddleLayer, RedisMiddleLayer} from "./RedisMiddleLayer";
import {Dictionary} from "dictionaryjs";
import {Callback} from "redis";

const multiCommands:Array<string> = ["exec_atomic","exec_transaction","exec"];

export class PhanxRedis extends RedisMiddleLayer {

    /**
     * Set to false to not throw errors, use .error to check if not null.
     * By default its true: meaning you need to wrap with try/catch.
     */
    public throwErrors:boolean = true;

    /**
     * Contains the last operation's error or null if none.
     */
    public error:Error;

    /**
     * Contains the last operation's result.
     */
    public result:any;


    constructor(config:object=null) {
        super(config);
        //let client = redis.createClient(config);

        Object.defineProperty(this, "__private__", {
            value: {},
            enumerable: false
        });


        this.__setupMethods();

    }


    /**
     * Attempts to look for a key and if its null return the default
     *   parameter.
     *
     * @param key - key to lookup
     * @param defaultValue - default value if its not found
     * @param {Function} cb
     * @returns {Promise<any>}
     */
    public getDefault(key:any,defaultValue:any,cb:Function=null):Promise<any> {

        return new Promise((resolve,reject)=> {

            this.get(key, (err,result) => {
                if (err) {
                    if (cb)
                        cb(err,result);
                    else
                        this._handleCallback(resolve, reject,err, result);
                    return;
                }

                if (result==null) {
                    this._handleCallback(resolve, reject, null, defaultValue);
                    return;
                }

                this._handleCallback(resolve, reject, null, result);


            });

        });

    }


    /**
     * Sets an object to key by converting it to json first.
     *
     * @param key - key to set
     * @param obj - value to set
     * @param {Function} cb - (optional) - cb(err, result)
     * @returns {Promise<any>}
     */
    public setJson(key:any,obj:any,cb:Function=null):Promise<any> {

        return new Promise((resolve,reject)=> {
            let json:string = null;

            try {
                json = JSON.stringify(obj);
            } catch(e) {
                json = null;
                this._handleCallback(resolve, reject, e);
                return;
            }

            this.set(key,json, (err, result) => {
                this._handleCallback(resolve, reject, err, result);
            });
        });

    }


    /**
     * Get key from server and automatically parse as json.
     *
     * @param key - key to lookup
     * @param {Function} cb - (optional) - cb(err:Error,result:Object)
     * @returns {Promise<any>}
     */
    public getJson(key:any,cb:Function=null):Promise<any> {

        return new Promise((resolve, reject) => {

            this.get(key,(err,result)  => {
                if (err) {
                    if (cb)
                        cb(err);
                    else
                        this._handleCallback(resolve, reject, err, result);
                    return;
                }

                if (result==null) {
                    if (cb)
                        cb(null,null);
                    else
                        this._handleCallback(resolve, reject, null);
                    return;
                }

                try {
                    let obj:any = JSON.parse(result);
                    if (cb)
                        cb(err, obj);
                    else
                        this._handleCallback(resolve, reject, err, obj);
                    return;
                } catch (e) {
                    if (cb)
                        cb(e);
                    else
                        this._handleCallback(resolve, reject, e);
                    return;
                }

            });
        });

    }

    /**
     * Searches for all keys that match the search.
     * cbIterator may be used to return one row at a time.
     * Or you may get a Dictionary (dictionaryjs) collection
     *   returned from the promise if you don't set cbIterator.
     * Note: setting the cbIterator will result in no Dictionary
     *   creation.
     *
     * <pre>
     *     let result:Dictionary<any,any> = await redis.getSearch("key.*");
     * </pre>
     *
     * @param {string} search - key search
     * @param {Function} cbIterator - (optional) - cb(key,data,cbNext)
     * @param {Function} cbFinal - (optional) - cb(err)
     * @returns {Promise<Dictionary<any,any>>}
     */
    public getSearch(search:string,cbIterator:Function=null,
                     cbFinal:Function=null):Promise<Dictionary<any,any>>
    {
        let self:PhanxRedis = this;


        return new Promise((resolve, reject) => {


            let cursor:number = 0;
            let keyResults:Array<any> = [];
            let results:Dictionary<any,any> = null;

            if (cbIterator==null)
                results = new Dictionary<any,any>();

            let counter:number;
            let len:number;

            function searchStep() {
                self.pxscan(cursor,"MATCH",search, (err,reply) => {

                    if (err) {
                        if (cbFinal)
                            cbFinal(err);
                        else
                            self._handleCallback(resolve,reject,err);
                        return;
                    }
                    if (reply==null || reply.length!=2) {

                        let err:Error = new Error("No reply");

                        if (cbFinal)
                            cbFinal(err,reply);
                        else
                            self._handleCallback(resolve,reject,err);

                        return;
                    }

                    keyResults = keyResults.concat(reply[1]);

                    if (reply[0]!=0) {
                        //not done, keep going!!
                        cursor = reply[0];
                        searchStep();
                    } else {
                        //done
                        counter = 0;
                        len = keyResults.length;
                        loopStep();
                    }

                });
            }
            searchStep();


            function loopNext() {
                if (counter < len) {
                    process.nextTick(loopStep);
                } else {

                    if (cbFinal)
                        cbFinal();
                    else {
                        if (results!=null) {

                            self._handleCallback(resolve, reject,
                                null,results);

                        } else
                            self._handleCallback(resolve, reject, null);
                    }
                    return;
                }
            }
            function loopStep() {
                if (counter < len ) {
                    let key = keyResults[counter++];

                    self.get(key,function(err,result) {
                        if (err) {
                            if (cbFinal)
                                cbFinal(err);
                            else
                                self._handleCallback(resolve,reject,err);                                  return;
                        }

                        if (results!=null) {

                            results.set(key,result);
                            loopNext();

                        } else {

                            if (cbIterator(key, result, loopNext) == false) {
                                if (cbFinal)
                                    cbFinal();
                                else
                                    self._handleCallback(resolve, reject,
                                        null);
                                return;
                            }
                        }
                    });
                } else {
                    if (cbFinal)
                        cbFinal();
                    else {

                        if (cbIterator==null) {

                            self._handleCallback(resolve, reject,
                                null,results);

                        } else
                            self._handleCallback(resolve, reject, null);
                    }
                }
            }


        });

    }


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
    public delSearch(search:string,cbFinal:Function=null):Promise<any> {

        let self:PhanxRedis = this;

        return new Promise((resolve,reject) => {


            let cursor:number = 0;
            let results:Array<any> = [];

            let counter:number;
            let len:number;
            let delCount:number = 0;

            function searchStep() {
                self.pxscan(cursor,"MATCH",search, (err,reply) => {

                    if (err) {
                        if (cbFinal)
                            cbFinal(err,reply);
                        else
                            self._handleCallback(resolve,reject,err);                                  return;
                    }
                    if (reply==null || reply.length!=2) {
                        let err:Error = new Error("No reply");

                        if (cbFinal)
                            cbFinal(err,reply);
                        else
                            self._handleCallback(resolve,reject,err);                                   return;
                    }

                    results = results.concat(reply[1]);

                    if (reply[0]!=0) {
                        //not done, keep going!!
                        cursor = reply[0];
                        searchStep();
                    } else {
                        //done
                        counter = 0;
                        len = results.length;
                        loopStep();
                    }

                });
            }
            searchStep();

            function loopNext() {
                if (counter < len) {
                    process.nextTick(loopStep);
                } else {

                    if (cbFinal)
                        cbFinal(null,delCount);
                    else
                        self._handleCallback(resolve,reject,null,delCount);
                    return;
                }
            }
            function loopStep() {
                if (counter < len ) {
                    let key = results[counter++];

                    self.del(key,function(err,result) {
                        if (err) {
                            if (cbFinal)
                                cbFinal(err,result);
                            else
                                self._handleCallback(resolve,reject,err);
                            return;
                        }
                        delCount+=result;
                        loopNext();
                    });
                } else {
                    if (cbFinal)
                        cbFinal(null,delCount);
                    else
                        self._handleCallback(resolve,reject,null,delCount);
                    return;
                }
            }

        });

    }



    private __setupMethods():void {



        //get command list from redis-commands module
        for (let command of commands.list) {
            let commandName:string = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1');

            this._setMapping(commandName);

            commandName = commandName.toUpperCase();

            this._setMapping(commandName);
        }

    }

    private _setMapping(command:string):void {

        let commandUpper:string = command.toUpperCase();

        if (commandUpper == "MULTI" || commandUpper == "BATCH") {
            this[command] = this._multiMapper(commandUpper);
            return;
        }

        let functionRef:Function = this[command];

        if (functionRef==null) return;

        let name:string = functionRef.name;

        if (typeof(functionRef) == "function" && name.indexOf("internal")===-1) {
            this[command] = this._mapperMethod(functionRef);
        }

    }

    private _multiMapper(commandUpper:string):Function {
        let self:PhanxRedis = this;
        return (...args) => {

            let multi:PhanxRedisMulti = new PhanxRedisMulti(self,args);

            if (commandUpper=="MULTI")
                multi.exec = multi.EXEC = multi.exec_transaction;

            return multi;
        };
    }

    private _mapperMethod(functionRef:Function):Function
    {

        let self:PhanxRedis = this;

        return (...args):Promise<any> => {

            return new Promise((resolve, reject) => {

                let argLength:number = 0;
                if (args!=null) argLength = args.length;

                let lastArgReplaced:Boolean = false;

                if (argLength>=1) {
                    let lastArg:any = args[argLength - 1];
                    if (lastArg != null && typeof(lastArg) === "function") {
                        lastArgReplaced = true;
                        args[argLength - 1] = (err,result) => {
                            lastArg(err,result);

                            this._handleCallback(resolve, reject, err, result);

                        }
                    }
                }

                if (!lastArgReplaced) {
                    args.push((err,result) => {

                        this._handleCallback(resolve, reject, err, result);

                    });
                }

                functionRef.call(self,...args);

            });

        };


    }

    private _handleCallback(resolve, reject, err, result=null):void {

        this.error = err;
        this.result = result;

        if (err) {
            if (this.throwErrors)
                reject(err);
            else
                resolve(null);
        } else
            resolve(result);
    }


}

class PhanxRedisMulti extends MultiMiddleLayer {

    private parent:PhanxRedis;

    constructor(parent,args) {
        super(parent,args);

        this.parent = parent;

        this._setupMethods();

    }

    private _setupMethods():void {

        for (let command of multiCommands) {
            let commandName:string = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1');

            this._setMapping(commandName);

            commandName = commandName.toUpperCase();

            this._setMapping(commandName);
        }

    }

    private _setMapping(command:string):void {


        let functionRef:Function = this[command];

        if (functionRef==null) return;

        let name:string = functionRef.name;

        if (typeof(functionRef) == "function" && name.indexOf("internal")===-1) {
            this[command] = this._mapperMethod(functionRef);
        }


    }

    private _mapperMethod(functionRef:Function):Function {

        let self:PhanxRedisMulti = this;

        return (...args):Promise<any> => {

            return new Promise((resolve, reject) => {

                let argLength:number = 0;
                if (args!=null) argLength = args.length;

                let lastArgReplaced:Boolean = false;

                if (argLength>=1) {
                    let lastArg:any = args[argLength - 1];
                    if (lastArg != null && typeof(lastArg) === "function") {
                        lastArgReplaced = true;
                        args[argLength - 1] = (err,result) => {
                            lastArg(err,result);

                            this._handleCallback(resolve, reject, err, result);

                        }
                    }
                }

                if (!lastArgReplaced) {
                    args.push((err,result) => {

                        this._handleCallback(resolve, reject, err, result);

                    });
                }

                functionRef.call(self,...args);

            });

        };

    }


    private _handleCallback(resolve:Function, reject:Function,
                            err:Error, result:any):void
    {

        this.parent.error = err;
        this.parent.result = result;

        if (err) {
            if (this.parent.throwErrors)
                reject(err);
            else
                resolve(null);
        } else
            resolve(result);
    }


}
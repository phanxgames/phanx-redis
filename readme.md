Redis wrapper adding promise and typescript support.

### Features

* Provided Typescript source code.
* Exposes all REDIS commands and wraps them with promises.
* Provides two helper methods for searching and looping through values:  getSearch and delSearch.

### install

<pre>
npm install phanx-redis
</pre>

### Requirements

* ECMAScript 2016 (ES6)
* Node.JS 6.x or later (tested on 6.11)


### Basic Example

<pre>

let PhanxRedis = require("phanx-redis");

let config = {
	host: "127.0.0.1"
};

let rs = new PhanxRedis(config);

async function run() {
    await rs.set("key","test");
    console.log("set key!");

    //get key value and return to value after async operation completes
    let keyvalue = await rs.get("key");
    console.log("key=",keyvalue);

}
run();

</pre>

## Helper Methods exclusive to this module:


#### getDefault(key,defaultValue)

Just like the standard .get(key) method, but instead will allow you to provide a default value if the key is not found or is null.

<pre>
let value = await rs.getDefault("undefined key","not found");
console.log(value); //outputs "not found"
</pre>


#### getJson(key)

Will attempt to automatically parse the JSON and return the object.

<pre>
await rs.set("an object",JSON.stringify({foo:"bar"}));

let obj = await rs.getJson("an object");
console.log(obj.foo); //outputs: "bar"
</pre>


#### setJson(key, object)

Will attempt to convert passed in object to JSON and save to key.

<pre>
await rs.setJson("key",{foo:"bar"});

// .. later ..

let obj = await rs.getJson("key");
console.log(obj.foo); //outputs: "bar"
</pre>


#### getSearch(key, callback(key,value,cbnext) )

This method allows you to loop over key/values that match your search criteria.
Internally it uses the SCAN redis command.

<pre>
	//lets add a whole bunch of keys
	await rs.set("chara_a",1);
	await rs.set("chara_b",2);
	await rs.set("chara_c",3);
	await rs.set("chara_d",4);
	await rs.set("chara_e",5);
	await rs.set("chara_f",6);

	await rs.getSearch("chara_*",function(key,value,cbNext) {
		console.log("   ",key,value);
		cbNext();
	});

	console.log("search complete");
</pre>

Alternatively, you can return the search result in a Dictionary (dictionaryjs) collection and use all the great dictionaryjs methods to iterate through it.

<pre>
    let rows = await rs.getSearch("chara_*");
    console.log(result);

    for (let row of rows) {
        console.log(row);
    }
</pre>

#### delSearch(key)

This method is similar to the getSearch method, but instead of allowing you to loop
through the results, it deletes them, and then returns the delete count.

<pre>
	let delcount = await rs.delSearch("chara_*");
	console.log("deleted " + delcount + " keys");
</pre>


### multi() Functionality

Multi allows commands to be queued together, and ensures that all commands succeed or all fail.

.mutli() chaining functionality is not supported by this module.
You may access its functionality by not chaining it. Such as:

<pre>
	let multi = rs.multi();

	multi.dbsize();
	multi.set("test","blah");
	multi.set("phanx","games");
	multi.dbsize();

    let results = await multi.exec();
    console.log(results);
</pre>


### Error Handling

You can disable errors being thrown and handle errors by checking if an error existed in the previous operation.

<pre>

rs.throwErrors = false;

await rs.get("key");

if (rs.error) {
    //handle error
} else {
    //do something with the last operation's result
    let value = rs.result;
}

</pre>

Otherwise, by default throwErrors is true, and thus you will need to handle errors using try/catch.

### Based on node_redis

This module wraps the <a href="https://github.com/NodeRedis/node_redis">node_redis</a> module.
Please review this module for more information about what methods and commands are available to you.



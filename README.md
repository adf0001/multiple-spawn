# multiple-spawn
run multiple nodejs spawn

# Install
```
npm install multiple-spawn
```

# Usage & Api
```javascript

var multiple_spawn = require("multiple-spawn");

//.start(nameList, commandPath, args, options, eventCallback)
var ret = multiple_spawn.start("ping-1", "ping -n 4 www.163.com", null, null, function (state) {
	console.log(state);		//"start" or "exit"
	if (state === "exit") {
		//.getConsole(nameList [, item] )
		console.log( multiple_spawn.getConsole(null, ret) );
	}
});

if (ret instanceof Error) console.log( "error", ret );
else console.log( "start ok, pid=" + ret.process.pid );

//.stop(nameList)

```

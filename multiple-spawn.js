
// multiple-spawn @ npm, run multiple nodejs spawn.

var path = require("path");
var child_process = require("child_process");

var property_by_name_list = require("property-by-name-list");
var add_text_to_line_array = require("add-text-to-line-array");

var spawnData = {};	//map name list path to spawn item { console, commandPath, process, nameList }
var historyConsole = {};	//map name list path to console history

var spawnItem = function (nameList, value) {
	if (value) {
		//save normalized nameList
		value.nameList = (typeof nameList === "string") ? [nameList] : nameList;

		property_by_name_list(historyConsole, nameList, null, true);	//delete history console

		return property_by_name_list(spawnData, nameList, value);		//set
	}
	else if (typeof value === "undefined") {
		return property_by_name_list(spawnData, nameList);		//get
	}
	else {
		property_by_name_list(spawnData, nameList, value, true);		//delete
	}
}

//options:{ maxConsoleLineNumber, keepHistoryConsole }
var start = function (nameList, commandPath, args, options, eventCallback) {
	var item = spawnItem(nameList);
	if (item) {
		var s = "spawn already started, " + nameList;
		console.log(s);
		return Error(s);
	}

	if (!options) options = {};
	if (!("cwd" in options)) options.cwd = path.dirname(commandPath);
	if (!("shell" in options)) options.shell = true;

	item = { console: [commandPath, ""], commandPath: commandPath };
	item.process = child_process.spawn(commandPath, args, options);

	//console.log("stdio.length=" + item.process.stdio.length);

	item.process.stdout.on('data', (data) => {
		//console.log(data);
		var s = data.toString();
		add_text_to_line_array(item.console, s, "", options.maxConsoleLineNumber);
		console.log(nameList + ": " + s.replace(/\s+$/, ""));
	});

	item.process.stderr.on('data', (data) => {
		var s = data.toString();
		add_text_to_line_array(item.console, s, "stderr: ", options.maxConsoleLineNumber);
		console.error(nameList + ", stderr: " + s.replace(/\s+$/, ""));
	});

	item.process.on('exit', (code) => {
		console.log("spawn exited with code " + code + ", " + nameList);

		if (options.keepHistoryConsole && item && item.console && item.console.length > 0) {
			//save history console, if options.keepHistoryConsole is set true
			property_by_name_list(historyConsole, nameList, item.console);
		}

		spawnItem(nameList, null);
		if (eventCallback) eventCallback("exit");
	});

	spawnItem(nameList, item);
	if (eventCallback) eventCallback("start");

	return item;
}

var stop = function (nameList) {
	var item = spawnItem(nameList);
	if (!item) return Error("spawn not exists, " + nameList);

	item.process.kill();
	return true;
}

//var getConsole = function (nameList [, item] )
var getConsole = function (nameList, item) {
	if (!item) item = spawnItem(nameList);
	if (!item) {
		item = property_by_name_list(historyConsole, nameList);
		if (!item) return "(not exists, " + nameList + ")";
		else return item.join("\n") + "\n\n(stopped, history for " + nameList + ")";
	}

	if (!item.console || !(item.console.length > 0)) return "(void)";
	else return item.console.join("\n");
}

// module

module.exports = {
	spawnData: spawnData,
	spawnItem: spawnItem,

	start: start,
	stop: stop,

	getConsole: getConsole,
};

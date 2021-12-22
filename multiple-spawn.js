
// multiple-spawn @ npm, run multiple nodejs spawn.

var path = require("path");
var child_process = require("child_process");

var property_by_name_list = require("property-by-name-list");
var text_line_array = require("text-line-array");
var pid_descendant = require("pid-descendant");

var spawnData = {};	//map name list path to spawn item { console, commandPath, process, nameList, options }
var historyConsole = {};	//map name list path to console history

var spawnItem = function (nameList, value) {
	if (value) {
		//save normalized nameList
		value.nameList = (typeof nameList === "string") ? [nameList] : nameList;

		//property_by_name_list(historyConsole, nameList, null, true);	//delete history console

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

	item = {
		console: text_line_array([commandPath, ""], { maxLineNumber: options.maxConsoleLineNumber }),
		commandPath: commandPath,
		options: options
	};
	item.process = child_process.spawn(commandPath, args, options);

	//console.log("pid=" + item.process.pid);

	item.process.stdout.on('data', (data) => {
		//console.log(data);
		var s = data.toString();
		item.console.add(s);
		console.log(nameList + ": " + s.replace(/\s+$/, ""));
	});

	item.process.stderr.on('data', (data) => {
		var s = data.toString();
		item.console.add(s, "stderr: ");
		console.error(nameList + ", stderr: " + s.replace(/\s+$/, ""));
	});

	item.process.on('close', (code) => {
		console.log("spawn closed with code " + code + ", pid=" + item.process.pid + ", " + nameList);

		if (options.keepHistoryConsole && item && item.console && !item.console.isEmpty()) {
			//save history console, if options.keepHistoryConsole is set true
			var historyArray = property_by_name_list(historyConsole, nameList) || text_line_array();
			historyArray.addLine("");
			historyArray.addLine(item.console.lineArray);
			historyArray.addLine(["-----(exited, [" + nameList + "])-----", ""]);

			property_by_name_list(historyConsole, nameList, historyArray);
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

	item.process.stdin.end();

	//item.process.kill();
	pid_descendant.kill(item.process.pid);

	return true;
}

//stop and clear history console
var remove = function (nameList) {
	var item = spawnItem(nameList);
	if (item && item.options) item.options.keepHistoryConsole = false;

	property_by_name_list(historyConsole, nameList, null, true);
	return stop(nameList);
}

function getHistoryConsole(nameList) {
	var item = property_by_name_list(historyConsole, nameList);
	if (!item) return null;

	return item.toString();
}

//history: true or "auto"
//item: for debug
//var getConsole = function (nameList [, history [, item]] )
var getConsole = function (nameList, history, item) {
	if (history && history != "auto") return getHistoryConsole(nameList);

	if (!item) item = spawnItem(nameList);

	if (!item) {
		return history ? getHistoryConsole(nameList) : null;
	}

	return item.console ? item.console.toString() : null;
}

// module

module.exports = {
	spawnData: spawnData,
	historyConsole: historyConsole,

	spawnItem: spawnItem,

	start: start,
	stop: stop,
	remove: remove,

	getConsole: getConsole,
};

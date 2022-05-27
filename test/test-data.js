
//refer tpsvr @ npm.

module.exports = {

	"multiple_spawn": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";

		var multiple_spawn = require("../multiple-spawn.js");

		var doneCnt = 0;

		var ret = multiple_spawn.start("ping-1", "ping -n 4 www.163.com", null, null, function (state) {
			console.log(state);
			if (state === "exit") {
				console.log("====================");
				console.log("ping-1 exited\n" + multiple_spawn.getConsole(null, null, ret));
				console.log("--------------------");
				doneCnt++;
				if (doneCnt == 2) done(false);
			}
		});
		if (ret instanceof Error) { done(ret); return; }
		console.log("start ping-1 ok, pid=" + ret.process.pid)

		var ret2 = multiple_spawn.start("ping-1", "ping -n 4 www.163.com");
		if (!(ret2 instanceof Error)) { done("expect error"); return; }
		console.log(ret2.message);

		var ret3 = multiple_spawn.start("ping-2", "ping", ["-n", "4", "www.163.com"], { keepHistoryConsole: true },
			function (state) {
				console.log(state);
				if (state === "exit") {
					//.historyConsole = function (nameList [, appendText] )
					multiple_spawn.historyConsole("ping-2", ["append some text"]);

					console.log("====================");
					console.log("ping-2 exited\n" + multiple_spawn.getConsole("ping-2", "auto"));
					console.log("--------------------");

					multiple_spawn.historyConsole("ping-2", null);	//clear history

					console.log("====================");
					console.log("ping-2 exited, clear history\n" + multiple_spawn.getConsole("ping-2", "auto"));
					console.log("--------------------");

					multiple_spawn.remove("ping-2");
					console.log("ping-2 history, removed\n" + multiple_spawn.getConsole("ping-2", "auto"));
					console.log("--------------------");

					doneCnt++;
					if (doneCnt == 2) done(false);
				}
			}
		);
		if (ret3 instanceof Error) { done(ret3); return; }
		console.log("start ping-2 ok, pid=" + ret3.process.pid)
	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('multiple_spawn', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(15000); } });

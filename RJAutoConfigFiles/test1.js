(
	new (ChromeUtils.importESModule(
		"resource://gre/modules/Console.sys.mjs"
	)).ConsoleAPI({maxLogLevel:false})
).log("LOADED TEST 1");
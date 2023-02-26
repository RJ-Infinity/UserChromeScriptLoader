// commented line is important??

/*
	this is a script loader for firefox UserChrome.js
	it loads the `RJAutoConfig.jon` file in the user appdata folder it then reads the
	file location and files specified there and loads them onto firefox windows loaded
*/

/* derived from https://www.reddit.com/r/firefox/comments/kilmm2/ and https://github.com/alice0775/userChrome.js*/

(async function(){
	function readFile(aFile){
		// gets the data in the passed in file
		// courtesy of https://github.com/alice0775/userChrome.js
		var stream = Components.classes[
			"@mozilla.org/network/file-input-stream;1"
		].createInstance(Components.interfaces.nsIFileInputStream);
		stream.init(aFile, 0x01, 0, 0);
	
		var cvstream = Components.classes[
			"@mozilla.org/intl/converter-input-stream;1"
		].createInstance(Components.interfaces.nsIConverterInputStream);
		cvstream.init(stream, "UTF-8", 1024, Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
		
		var content = "", data = {};
		while (cvstream.readString(4096, data)) { content += data.value; }
		cvstream.close();
		return content;
	}
	try {
		// load the modules
		const { ConsoleAPI } = ChromeUtils.importESModule("resource://gre/modules/Console.sys.mjs");
		const console = new ConsoleAPI({maxLogLevel:false});
		const { Services } = Components.utils.import("resource://gre/modules/Services.jsm");
		const FileProtocolHandler = Services.io.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
		const ScriptLoader = Services.scriptloader
		
		// get the UserAppData firefox directory i.e. "C:\\Users\\USERNAME\\AppData\\Roaming\\Mozilla\\Firefox"
		var dir = Services.dirsvc.get("UAppData", Components.interfaces.nsIFile).directoryEntries; 
		var files = [];

		// add each file in the dir to files
		while (dir.hasMoreElements())
		{files.push(dir.getNext().QueryInterface(Components.interfaces.nsIFile));}

		// get the file "RJAutoConfig.json"
		var RJAutoConfigFile = files.filter(f=>f.displayName=="RJAutoConfig.json");
		if (RJAutoConfigFile.length==0){
			console.error(
				"No RJAutoConfig.json in the folder '"+
				Services.dirsvc.get("UAppData", Components.interfaces.nsIFile).path+
				"' no extra js files will be loaded."
			);
			return;
		}

		// get the files File interface
		RJAutoConfigFile = RJAutoConfigFile[0].QueryInterface(Components.interfaces.nsIFile);
		try{
			RJAutoConfig = readFile(RJAutoConfigFile);
		}catch(ex){
			console.error(
				"Error reading the file '"+
				RJAutoConfigFile.path+
				"' no extra js files will be loaded. bellow is the exeption\n"+ex
			);
			return;
		}

		try{
			RJAutoConfig = JSON.parse(RJAutoConfig);
		}catch(ex){
			console.error(
				"Error parsing the file '"+
				RJAutoConfigFile.path+
				"' no extra js files will be loaded. bellow is the exeption\n"+ex
			);
			return;
		}

		if (!("dir" in RJAutoConfig)){
			console.error("RJAutoConfig.json missing the dir property "+
			"no extra js files will be loaded.");
			return;
		}
		if (!(RJAutoConfig.dir.constructor == String)){
			console.error("RJAutoConfig.json's dir property must be a string"+
			"no extra js files will be loaded.");
			return;
		}
		if (!("files" in RJAutoConfig)){
			console.error("RJAutoConfig.json missing the files property "+
			"no extra js files will be loaded.");
			return;
		}
		if (!(RJAutoConfig.files.constructor == Array)){
			console.error("RJAutoConfig.json's files property must be a array"+
			"no extra js files will be loaded.");
			return;
		}

		RJAutoConfigDir = files.filter(f=>f.displayName===RJAutoConfig.dir);
		if (RJAutoConfigDir.length==0){
			console.error(
				"the directory '"+
				RJAutoConfig.dir+
				"' specified in RJAutoConfig.json was not found in the folder '"+
				Services.dirsvc.get("UAppData", Components.interfaces.nsIFile).path+
				"' no extra js files will be loaded."
			);
			return;
		}
		if (!RJAutoConfigDir[0].isDirectory()){
			console.error(
				"the location '"+
				RJAutoConfig.dir+
				"' specified in RJAutoConfig.json must be a directory. "+
				"no extra js files will be loaded."
			);
			return;
		}
		// get the RJAutoConfig dir object
		RJAutoConfigDir = RJAutoConfigDir[0].QueryInterface(Components.interfaces.nsIFile).directoryEntries;
		files = [];
		while (RJAutoConfigDir.hasMoreElements())
		{files.push(RJAutoConfigDir.getNext().QueryInterface(Components.interfaces.nsIFile));}

		files = files.filter(f=>RJAutoConfig.files.includes(f.displayName));
		RJAutoConfig.files.filter(
			file=>!files.map(f=>f.displayName).includes(file)
		).forEach(file=>console.warn(
			"the file '"+
			file+
			"' specified in RJAutoConfig.json was not found.\n"+
			"skipping the file."
		));
		function ConfigJS() {Services.obs.addObserver(this, "chrome-document-global-created", false);}
		ConfigJS.prototype = {
			observe: function (aSubject) {
				aSubject.addEventListener("DOMContentLoaded", this, { once: true });
			},
			handleEvent: function (aEvent) {
				if (!aEvent.originalTarget.defaultView._gBrowser){return;}
				files.forEach(
					file=>{
						ScriptLoader.loadSubScript(
							FileProtocolHandler.getURLSpecFromActualFile(file),
							aEvent.originalTarget.defaultView
						);
						console.log("loaded file ",file.displayName);
					}
				);
			}
		};
		if (!Services.appinfo.inSafeMode) { new ConfigJS(); }
	} catch (ex) {
		(new (ChromeUtils.importESModule(
			"resource://gre/modules/Console.sys.mjs"
		)).ConsoleAPI({maxLogLevel:false})).error(ex);
	};
})();

// var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
// newTabBrowser.addEventListener("load", function() {
// 	newTabBrowser.contentDocument.body.innerHTML = "<h1>this page has been eaten</h1>";
//    }, true);
//    newTabBrowser.contentDocument.location.href = "https://mozilla.org/";
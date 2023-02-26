// commented line is important??

/*
	this is a script loader for firefox UserChrome.js
	it loads the `RJAutoConfig.jon` file in the user appdata folder it then reads the
	file location and files specified there and loads them onto firefox windows loaded
*/

/* derived from https://www.reddit.com/r/firefox/comments/kilmm2/ and https://github.com/alice0775/userChrome.js*/

(function(){
	function readFile(file){
		// gets the data in the passed in file
		var data = "";
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
			createInstance(Components.interfaces.nsIFileInputStream);
		var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
			createInstance(Components.interfaces.nsIConverterInputStream);
		fstream.init(file, -1, 0, 0);
		cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
		
		let read = 0;
		let str = {};
		do {
			read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
			data += str.value;
		} while (read != 0);
		cstream.close(); // this closes fstream
		return data;
	}
	function readBinary(binaryFile){
		var inputStream = Components
		.classes["@mozilla.org/network/file-input-stream;1"]
		.createInstance(Components.interfaces.nsIFileInputStream);
		inputStream.init(binaryFile, -1, -1, false);

		var binaryStream = Components
		.classes["@mozilla.org/binaryinputstream;1"]
		.createInstance(Components.interfaces.nsIBinaryInputStream);
		binaryStream.setInputStream(inputStream);

		return binaryStream.readBytes(binaryStream.available());
	}

	function writeBinary(aFile, aData){
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
		// Use 0x02 | 0x10 when appending to a file
		foStream.init(aFile, 0x02 | 0x08 | 0x20, parseInt(664, 8), 0); // write, create, truncate
		foStream.write(aData, aData.length);
		foStream.close();
		return aData;
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
		if (!(RJAutoConfig.dir.constructor === String)){
			console.error("RJAutoConfig.json's dir property must be a string"+
			"no extra js files will be loaded.");
			return;
		}
		if (!("scripts" in RJAutoConfig)){
			console.error("RJAutoConfig.json missing the scripts property "+
			"no extra js files will be loaded.");
			return;
		}
		if (!(RJAutoConfig.scripts.constructor === Object)){
			console.error("RJAutoConfig.json's scripts property must be an object "+
			"no extra js files will be loaded.");
			return;
		}

		if (Object.values(RJAutoConfig.scripts).find(f=>f.constructor !== Object)){
			console.error("RJAutoConfig.json's scripts' properties must be objects "+
			"no extra js files will be loaded.");
			return;
		}

		var RJAutoConfigDir = files.filter(f=>f.displayName===RJAutoConfig.dir);
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
		RJAutoConfigDir = RJAutoConfigDir[0].QueryInterface(Components.interfaces.nsIFile)
		var RJAutoConfigDirIttr = RJAutoConfigDir.directoryEntries;
		files = [];
		while (RJAutoConfigDirIttr.hasMoreElements())
		{files.push(RJAutoConfigDirIttr.getNext().QueryInterface(Components.interfaces.nsIFile));}

		var scripts = files.filter(
			f=>Object.keys(RJAutoConfig.scripts).includes(f.displayName)
		).map(f=>({obj:f}));

		Object.keys(RJAutoConfig.scripts).filter(
			file=>!scripts.map(f=>f.obj.displayName).includes(file)
		).forEach(file=>console.warn(
			"the file '"+
			file+
			"' specified in RJAutoConfig.json was not found.\n"+
			"skipping the file."
		));

		Object.entries(RJAutoConfig.scripts).filter(s=>"resources" in s[1]).forEach(
			s=>{
				var index = scripts.findIndex(script=>script.obj.displayName == s[0]);
				if (index < 0){return;}// if it dosent exist ignore
				scripts[index].requestedResources = s[1].resources.map(
					r=>[r,r.split("/").reduce(
						(acc,pathSection)=>(acc.append(pathSection),acc),
						RJAutoConfigDir.clone()
					)]
				).reduce((acc,files)=>(acc[files[0]]=files[1],acc),{})
			}
		);

		var currentTime = Date.now();
		function ConfigJS() {Services.obs.addObserver(this, "chrome-document-global-created", false);}
		ConfigJS.prototype = {
			observe: function (aSubject) {
				aSubject.addEventListener("DOMContentLoaded", this, { once: true });
			},
			handleEvent: function (aEvent) {
				// aEvent.originalTarget is document
				// aEvent.originalTarget.defaultView is window

				// exit if the window is not a browserWindow
				if (!aEvent?.originalTarget?.defaultView?._gBrowser){return;}
				aEvent.originalTarget.defaultView.RJResources = {
					readFile,readBinary,ScriptResources:{},RJAutoConfigDir
				};
				scripts.forEach(
					file=>{
						aEvent.originalTarget.defaultView
						.RJResources.ScriptResources[file.obj.displayName] = {
							requestedResources: file.requestedResources
						};
						ScriptLoader.loadSubScript(
							// the time property means that there is never a cache hit
							// this means that you will always get the most up to date
							// version. this is required as firefox never seems to
							// clear the cache of these files so it will always use the
							// first version that it loads
							FileProtocolHandler.getURLSpecFromActualFile(file.obj)+"?time="+currentTime,
							aEvent.originalTarget.defaultView
						);
						console.log("loaded file ",file.obj.displayName);
					}
				);
			}
		};
		// dont run if in safe mode
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
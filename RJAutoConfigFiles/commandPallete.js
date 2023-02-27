
class CommandPallete{
	keys;
	customKeySet;
	customCommandSet;
	pallete;
	elContainer;
	_resources;
	elements = {};
	removedKeys;
	commands;
	constructor(){
		this.keys = [...document.getElementsByTagName("key")];
		this._resources = RJResources.ScriptResources["commandPallete.js"];
		this.fuzzysort = RJResources.loadScript(
			this._resources.requestedResources["fuzzysort.min.js"]
		).fuzzysort;
		this.initKeyset();
		this.createElement();
		this.replaceShortcutKey();
		this.addShortcut();
		this.updateCommands();
	}
	initKeyset(){
		this.customKeySet = document.createXULElement("keyset");
		this.customKeySet.id = "RJCustomKeySet";
	
		var firstCommandSet = document.getElementsByTagName("keyset")[0];
		firstCommandSet.parentNode.insertBefore(this.customKeySet,firstCommandSet);

		this.customCommandSet = document.createXULElement("commandset");
		this.customCommandSet.id = "RJCustomCommandSet";
		
		var firstCommandSet = document.getElementsByTagName("commandset")[0];
		firstCommandSet.parentNode.insertBefore(this.customCommandSet,firstCommandSet);

		this.removedKeys = document.createXULElement("keyset");
		this.removedKeys.id = "RJRemovedKeys";
		document.documentElement.appendChild(this.removedKeys);
	}
	createElement(){
		this.elContainer = document.createElement("DIV");
		this.elContainer.id = "RJPalleteContainer";
		this.elContainer.addEventListener("keydown",e=>{
			if (e.key=="Escape"){document.activeElement.blur();}
			if (e.key=="ArrowDown" && (
				document.activeElement.parentNode.nextSibling!==null ||
				document.activeElement == this.elements.CommandSearch
			)){document.commandDispatcher.advanceFocus();e.preventDefault();}
			if (e.key=="ArrowUp"&&document.activeElement.parentNode.previousSibling!==null)
			{document.commandDispatcher.rewindFocus();e.preventDefault();}
		});

		this.elContainer.appendChild(
			document.createElement("style")
		).innerHTML = RJResources.readFile(
			this._resources.requestedResources["commandPallete.css"]
		);
		
		this.elements.CommandSearch = document.createElementNS("http://www.w3.org/1999/xhtml", "input");
		this.elements.CommandSearch.id = "RJCommandSearch";
		this.elements.CommandSearch.addEventListener("input",this.updateResults.bind(this))
		this.elContainer.appendChild(this.elements.CommandSearch);

		this.elements.CommandResults = document.createElement("ul");
		this.elements.CommandResults.id = "RJCommandResults";
		this.elements.CommandResults.setAttribute("tabindex", "-1");
		this.elContainer.appendChild(this.elements.CommandResults);

		document.body.appendChild(this.elContainer);
	}
	replaceShortcutKey(){
		var oldCtrlShiftP = this.keys.find(
			x=>x.getAttribute("key").toLowerCase()=="p" &&
			x.getAttribute("modifiers").includes("shift") &&
			x.getAttribute("modifiers").includes("accel")
		);
		if (oldCtrlShiftP===undefined){return;}
		var oldCtrlShiftPWithAlt = document.createXULElement("key");
		oldCtrlShiftPWithAlt.id = "RJreplacement"+oldCtrlShiftP.id;
		oldCtrlShiftPWithAlt.setAttribute("command",oldCtrlShiftP.getAttribute("command"));
		oldCtrlShiftPWithAlt.setAttribute("data-l10n-id",oldCtrlShiftP.getAttribute("data-l10n-id"));
		oldCtrlShiftPWithAlt.setAttribute("modifiers","accel,shift,alt");
		oldCtrlShiftPWithAlt.setAttribute("key",oldCtrlShiftP.getAttribute("key"));
		oldCtrlShiftPWithAlt.setAttribute("reserved",oldCtrlShiftP.getAttribute("reserved"));
		this.customKeySet.appendChild(oldCtrlShiftPWithAlt);

		// the docs dont like this but why not?
		oldCtrlShiftP.setAttribute("disabled","true");
		this.removedKeys.appendChild(oldCtrlShiftP)
	}
	addShortcut(){
		var command = document.createXULElement("command");
		command.id = "CommandPallete:open";
		command.setAttribute("oncommand","commandPallete.openPallete()");
		command.setAttribute("reserved","true");
		this.customCommandSet.appendChild(command);
		
		var command = document.createXULElement("key");
		command.id = "open_command_pallete";
		command.setAttribute("command","CommandPallete:open");
		command.setAttribute("modifiers","accel,shift");
		command.setAttribute("reserved","true");
		command.setAttribute("key","P");
		this.customKeySet.appendChild(command);
	}
	updateCommands(){
		this.commands = [...document.getElementsByTagName("command")].map(command=>({
			id: command.getAttribute("id"),
			command: command.getAttribute("oncommand"),
			label: command.getAttribute("label"),
			// commandInits: [...document.querySelectorAll("[command = "+command.getAttribute("id")+"]")].map(el=>({
			// 	content: el.innerText,
			// 	description: el.getAttribute("description"),
			// 	description: el.getAttribute("description"),
			// }))
		}));
	}
	updateResults(){
		[...this.elements.CommandResults.children].forEach(x=>x.remove());
		this.fuzzysort.go(
			this.elements.CommandSearch.value,
			this.commands,
			{key:"id",all:true}
		).map(cmd=>cmd.obj).map(cmd=>{
			var elcmd = document.createElement("button");
			elcmd.innerHTML = cmd.id;
			elcmd.classList.add("RJCommandPalleteItem");
			var elli = document.createElement("li")
			elli.appendChild(elcmd);
			return elli;
		}).forEach(el=>this.elements.CommandResults.appendChild(el));
	}
	openPallete(){
		// set the style so that foucs will work
		document.getElementById("RJPalleteContainer").classList.add("open");
		document.getElementById("RJCommandSearch").focus();
		// now that it has focus within the display can be removed
		document.getElementById("RJPalleteContainer").classList.remove("open");
		this.elements.CommandSearch.value = "";
		this.updateCommands();
		this.updateResults();
	}
}
// initialise
const commandPallete = new CommandPallete();
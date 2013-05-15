var QuickfireChrome = function() {
	
	var self = this;
	
	var port = chrome.extension.connect({name:"quickfire-chrome"});
	
	this.tellPageThatChromeExtensionIsPresent = function() {
		localStorage.setItem("qf.chrome", "true");
	}
	
	this.addHandlers = function() {
		
		window.addEventListener("message", function(event) {
			
			console.log("Content script: message received", event);
		    if (event.data.rx && (event.data.rx == "devtools" || event.data.rx == "background")) {
		      console.log("Content script received (from page)", event.data);
		      port.postMessage(event.data);
		    }
		}, false);

		port.onMessage.addListener(function(request, sender, sendResponse) {
		    console.log("Content script: message received (from background)", request);
		    window.postMessage(request, "*");
		});
	}
}

var q = new QuickfireChrome();
q.addHandlers();
q.tellPageThatChromeExtensionIsPresent();
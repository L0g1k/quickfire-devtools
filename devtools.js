'use strict';

var resources = [];
var port = chrome.extension.connect({name:"devtools"});
var testCSS = "body { background-color: red; color: blue }";
// If we are setting the resource content because quickfire told us to, then we don't want to fire an onResourceContentComitted event. 
var supressEvents = false;
//logProxy("DevTools opened; extension code initialising");

logMessageInBackgroundPage("DevTools opened; extension code initialising");

function logProxy(message) {
	chrome.devtools.inspectedWindow.eval("console.log('" + message + "')");
}

var errorDebug = function(error){
	   if(typeof error == 'undefined') {
		   logMessageInBackgroundPage("Set resource was a success");
	   } else {
		   logMessageInBackgroundPage("Set resource was a failure", error);
	   }
};
// register self with background page
notifyBackground({
	messageKey: 'chrome.devtools.init', 
	tabId: chrome.devtools.inspectedWindow.tabId
});


function notifyBackground(payload) {
	port.postMessage({
		 rx: 'background',
		 payload: payload
	});
}


// Useful for debugging. Messages sent to this function can be expected to be logged in the extension's background page.
function logMessageInBackgroundPage(messageString, /* optional */ messageObject) {
	 notifyBackground({
		 messageKey: 'chrome.devtools.logMessage',
		 message: messageString,
		 messageObject: messageObject
	});
}

port.onMessage.addListener(function(message) {
	//logMessageInBackgroundPage("Devtools: message received " + message);
    console.log("Devtools: message received", message);
    switch(message.messageKey) {
    	case 'quickfire.setResourceContent': 
			supressEvents = true;
			setResourceContent(message.content.url, message.content.content);
    		break;
    	case 'quickfire.marco' : polo(); break;
    }
});

function polo() {
	notifyQuickfire({
		messageKey: "chrome.devtools.polo",
		content: {}
	});
}

// FIXME: This needs to be /quickfire/ace.html in production; not /quickfiredev/ace.html
/*chrome.devtools.inspectedWindow.eval("window.open('/quickfiredev/ace.html', 'aceWindow')", function (res) {
	 
});*/
function testSetResource() {
	chrome.devtools.inspectedWindow.getResources(function(resources){
	    resources[4].setContent(testCSS, true, errorDebug);
	});
}

function debugResouceList() {
	chrome.devtools.inspectedWindow.getResources(function(resources){
		 notifyQuickfire({ 
				messageKey: "chrome.devtools.inspectedWindow.getResources",
				content: resources,
				event: {}
				});
	});
}
chrome.devtools.panels.create("pixelJET",
        "icon_32.png",
        "images.html",
        function(panel) {
	panel.createStatusBarButton('cloud19.png', 'something about clouds', false);
});
chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
	  chrome.devtools.inspectedWindow.eval("window.qf.onSelectionChanged($0)", function (res) {
		  notifyQuickfire({ 
				messageKey: "chrome.devtools.panels.elements.onSelectionChanged",
				content: {},
				event: {}
				});
	});
});  

chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(event, content) {
	
	// Don't notify quickfire about the event that it just sent us.
    if(supressEvents) {
    	supressEvents = false;
    	return;
    }
	try {
    	notifyQuickfire({ 
    				messageKey: "chrome.devtools.inspectedWindow.onResourceContentCommitted",
    				event: event, 
    				content: {
    					url: event.url,
    					type: event.type,
    					content: content
    				} 
    				});
    } catch (e) {
    	console.error(e);
    }

});

function notifyQuickfire(payload) {
	 port.postMessage({
		 rx: 'quickfire',
		 payload: payload
     });
}

function setResourceContent(url, content) {
	var found = false;
	logMessageInBackgroundPage("Attempting to search resources for " + url);
	chrome.devtools.inspectedWindow.getResources(function(resources){
		if(typeof resources === 'undefined') {
			logMessageInBackgroundPage("Error querying resource list in DevTools. Probably, that resource isn't actually in the page yet.");
		} else {
			logMessageInBackgroundPage(resources.length + " resources found; looping through them.");
			var index = 0;
		    resources.forEach(function(resource) {
		    	try {
		           if(resource.url == url) {
		        	   found = true;
		        	   logMessageInBackgroundPage("Match found for " + url + " at index " + index + "; setting content");
		               resource.setContent(content, true, errorDebug);
		           } 
		    	} catch (e) {
		    		logMessageInBackgroundPage(e.message + " found while looping through resources, trying to continue.");
		    	} finally {
		    		index++;
		    	}
		    });
		}
	});
	logMessageInBackgroundPage("Finished looping resources");
	if(!found) {
		logMessageInBackgroundPage("Error locating resource " + url + " in DevTools resource list. Probable bug.");
	}
}
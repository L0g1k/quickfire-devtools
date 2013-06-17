'use strict';

var ports = [];
var content = [];
var menuItems = [];
var RDPBridgeClient = new RDPBridgeClient();

initialiseEvents();

try {
    console.log("Initialising RDP bridge client");
    setTimeout(function () {
        RDPBridgeClient.init();
    }, 5);

} catch (e) {
    console.error("Couldn't connect to RDP server", e.stack);
}

function initialiseEvents() {
    // This is called whenever something 'connects' to this extension - that can be either DevTools or it could be a normal web page.

    // Note that this does not concern the connect to the Chrome App.

    chrome.extension.onConnect.addListener(function(port) {
        var tabId = port.sender.tab.id;

        // After a Chrome update, DevTools ports now initialise with their tabId set to -1. I haven't a clue why this is, but in this case we must avoid
        // these initialisation routines because they simply don't make sense.

        if(tabId != -1) {

            try {
                chrome.pageAction.show(tabId);
            } catch (e) {
                console.error(e);
            }
            // housekeeping
            var connection;

            if(ports[tabId]==undefined) {
                ports[tabId] = [];
            }

            port.onDisconnect.addListener(function(port) {
                delete ports[tabId][port.name];
                if(Object.keys(ports[tabId]).length == 0) {
                    delete ports[tabId];
                }
            });


        }
        RDPBridgeClient.connect(tabId, port);

        // listen to requests from devtools, then forward them straight to Quickfire via the content script
        if (port.name == "devtools") {
            // we need to add the devtools port to our port tracker, but we don't know the right tabId to use yet. The devtools script will send us a message
            // which confirms the tabId. Then we will add it to the port tracker
            port.onMessage.addListener(function(message) {
                try {
                    console.log("Background: message " + message.payload.messageKey + " received (devtools)", message);
                } catch (e) {}
                // we expect the devtools to tell us which tabId that it is inspecting. Then, we can register it inside 'ports'
                if(message.rx == "background") {
                    switch(message.payload.messageKey) {
                        case 'chrome.devtools.init': registerDevTools(port, message); break;
                        case 'chrome.devtools.logMessage': logMessageFromDevTools(message.payload.message, message.payload.messageObject); break;
                    }
                }
            });

        } else if (port.name == "quickfire-chrome") {
            ports[tabId][port.name] = port;

            try {
                console.log("New port opened: " + port.name + " from tab " + + tabId + " (" + ports.length + " total)."  , port);
            } catch (e) {}
            // this is for requests from quickfire (via the content script)
            port.onMessage.addListener(function(message) {
                console.log("Background: message received (quickfire-chrome)", message);
                if(message.rx == "background") {
                    switch(message.payload.messageKey) {
                        case 'quickfire.marco':  notifyQuickfire(tabId, "quickfire.polo", {}); break;
                    }
                } else if(message.rx == "devtools") {
                    notifyDevTools(tabId, message);
                }
            });
        }
    });

    chrome.pageAction.onClicked.addListener(function(tab) {
        notifyQuickfire(tab.id, "chrome.pageAction.onClicked");
        RDPBridgeClient.init();
        chrome.pageAction.setIcon({tabId: tab.id, path: 'cloud38-down.png'}, function(){
            setTimeout(function(){
                chrome.pageAction.setIcon({tabId: tab.id, path: 'cloud38.png'});
            }, 250);
        });
    });

    /**
     * Called when the DevTools is opened. Since there is only one instance of this background JavaScript for the entire browser, we have to manually track what
     * tab port relates to what devtools port as they are opened / closed.
     */
    function registerDevTools(port, message) {
        var tabId = message.payload.tabId;
        if(tabId) {
            ports[tabId][port.name] = port;
            console.log("New devtools port opened: " + port.name + " from tab " + + tabId + " (" + ports.length + " total)."  , port);
        }
        port.onMessage.addListener(function(message) {
            // Listen to messages from devtools, then forward them straight to Quickfire via the content script
            if (message.rx == "quickfire")
                proxyNotifyQuickfire(tabId, message);
        });
        port.onDisconnect.addListener(function(){
            notifyQuickfire(tabId, "bridge.devtools.onDisconnect");
        });
        notifyQuickfire(tabId, "bridge.devtools.onConnect");

    }
// Notify devTools
    function notifyDevTools(tabId, message) {

        var devToolsPort = ports[tabId]['devtools'];

        if(devToolsPort==null) {
            console.error("Port " + tabId + " not connected, skipping message ", message);
        } else {
            devToolsPort.postMessage(message.payload);
        }

    }

    function notifyQuickfire(tabId, messageKey, content) {

        var message = {
            rx: 'quickfire',
            payload : {
                messageKey: messageKey,
                content: content || {}
            }
        }
        if(typeof ports[tabId] === 'undefined' || ports[tabId]['quickfire-chrome'] == null) {
            console.error("Port " + tabId + " not connected, skipping message ", message);
        } else {
            var contentScriptPort = ports[tabId]['quickfire-chrome'];
            contentScriptPort.postMessage(message);
        }
    }

    function proxyNotifyQuickfire(tabId, message) {

        if(typeof ports[tabId] === 'undefined' || ports[tabId]['quickfire-chrome'] == null) {
            console.error("Port " + tabId + " not connected, skipping message ", message);
        } else {
            var contentScriptPort = ports[tabId]['quickfire-chrome'];
            contentScriptPort.postMessage(message);
        }
    }

    function logMessageFromDevTools(message, optionalMessageObject) {
        if(typeof optionalMessageObject === 'undefined') {
            console.log("Devtools: " + message);
        } else {
            console.log("Devtools: " + message, optionalMessageObject);
        }
    }

}



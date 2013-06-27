function RDPBridgeClient() {

    var self = this;
    var connected = false;
    var tabIdToUrlMap = {};
    var portToTabMap = {};
    var connectedDebuggerTabs = [];
    var appId = "mmefihllomekhdklofjkpdphmcogimbp";
    var connectedDevToolsTabs = [];
    var Messages = {
        ON_CONNECT: 1
    };

    // The initialisation between the main app and this extension can work either way around.
    this.init = function() {
        var self = this;

        // In this case, the server is telling us that it expects us to be active, and to initialise now.
        chrome.runtime.onConnectExternal.addListener(function(port){
            if(port.name == 'RDPBridgeServer') {
                _init(port);
            }
        });

        // Here, we know that we are now 'alive' so we should try to connect to the server immediately.
        console.log("Attempting to connect to the Chrome app...");
        this.port = chrome.extension.connect("mmefihllomekhdklofjkpdphmcogimbp", { name: 'Quickfire'});

        if(this.port) {
            _init(this.port);
        }

        function _init(port) {
            console.log("Connected successfully.");
            connected = true;
            port.onMessage.addListener(self.handleRemoteDebugMessage.bind(self));
        }

        // Housekeeping for the debuggers
        chrome.debugger.onDetach.addListener(function(debugee, reason) {
            delete self.connectedDebuggerTabs[debugee.tabId];
            console.log("Debugger for tab " + debugee.tabId + " disconnected: " + reason);
        });

    }

    this.handleRemoteDebugMessage = function(_message) {

        console.log("Handling Chrome extension message ", _message);

       // var message = JSON.parse(_message.substr(1, _message.length-1));
        var message = JSON.parse(_message);
        if(this.devToolsOpen(message)){
            console.log("Dev tools detected as open; emulating command");
            this.emulateRemoteCommand(message);
        } else {
            console.log("Dev tools detected as closed; sending command to remote debug protocol");
            this.runRemoteCommand(message);
        }
    }

    this.connect = function(tabId, port) {
        console.warn("connect method called; is this needed anymore?!");
        this.tabId = tabId;
        this.postMessage(tabId, "chrome.extension.onConnect", {port: { name: port.name }});
    }

    this.onDevToolsConnect = function(tabId, port) {
        console.log("RDP Bridge: devtools for " + tabId + " successfully registered");
        connectedDevToolsTabs.push(tabId);
        portToTabMap[port] = tabId;
    }

    this.onPageConnect = function(tabId, url) {
        tabIdToUrlMap[url] = tabId;
    }

    this.onDevToolsDisconnect = function(port) {
        var tabId = portToTabMap[port];
        if(tabId) {
            console.log("RDP Bridge: Removing devtools tab " + tabId);
            connectedDevToolsTabs.remove(tabId);
        } else {
            console.warn("Asked to register devtools tab for this port, but could not find corresponding tab entry", port);
        }
    }



    this.devToolsOpen = function(message) {
        var tabId = this.getTabId(message);
        if(tabId) {

        } else
            return false;
    }

    this.getTabId = function(message) {


        var url = message.url;
        if(url) {
            var tabId = tabIdToUrlMap[url];
            if(tabId) {
                return tabId;
            }
        } else {
            console.error("RDP bridge: A remote debug message was sent, but I wasn't able to determine which page it was for", message);
            var tabs = 0;
            var tabId;
            for(var key in tabIdToUrlMap) {
                if(tabIdToUrlMap.hasOwnProperty(key)) {
                    tabs++;
                    tabId = tabIdToUrlMap[key];
                }
            }
            if(tabs == 1) {
                return tabId;
            }
        }
    }

    this.runRemoteCommand = function(message) {
        var self = this;
        var tabId = this.getTabId(message);
        if(!tabId) {
            console.error("Tab id couldn't be determined for", message);
            return;
        }
        var target = connectedDebuggerTabs[tabId];
        if(!target) {
            target = {tabId: tabId};
            chrome.debugger.attach(
                target,
                "1.0",
                function() {
                    connectedDebuggerTabs[tabId] = target;
                    runCommandImpl(target)
                }
            );
        } else
            runCommandImpl(target);


        function runCommandImpl(target) {
            console.log("Debugger target found; executing command", message);
            chrome.debugger.sendCommand(target, message.method, message.params, function(result){
                  if(result) {
                      console.log("Command executed with no errors!", result);
                  }
            });
        }
    }


    this.emulateRemoteCommand = function (message) {
        var method = message.method, id = message.id, params = message.params;
        var methodCamelCased = this.methodCamelCased(method);
        var func = this['handle' + methodCamelCased];
        if(func)
            func.call(this, id, params);
        else {
            console.warn("Unknown message ", message);
        }
    }

    this.handleRuntimeEvaluate = function(id, params) {
        console.log("Evaluating", params);
    }

    this.handleCallFunctionOn = function(id, params) {
        console.log("Calling function on", params);
    }

    this.methodCamelCased = function(method) {
        var ret = "";
        if(method.indexOf(".") == -1) {
            return method;
        } else {
            var dot = false;
            for(var i=0; i<method.length; i++) {
                if(dot) {
                    ret += method.charAt(i).toUpperCase();
                    dot = false;
                } else {
                    var c = method.charAt(i);
                    if(c == ".") {
                        dot = true;
                    } else ret += method.charAt(i);
                }

            }

        }
        return ret;
    }

}

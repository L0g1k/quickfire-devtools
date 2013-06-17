function RDPBridgeClient() {

    var self = this;
    var appId = "mmefihllomekhdklofjkpdphmcogimbp";

    var Messages = {
        ON_CONNECT: 1
    };

    var connected = false;

    this.connect = function(tabId, port) {
        this.tabId = tabId;
        this.postMessage(tabId, "chrome.extension.onConnect", {port: { name: port.name }});
    }

    this.handleRemoteDebugMessage = function(request) {
        console.log("Extension: RDP message received on tab " + this.tabId  + request);
    }

    this.init = function() {
        console.log("Attempting to connect to the Chrome app...");
        this.port = chrome.extension.connect("mmefihllomekhdklofjkpdphmcogimbp", { name: 'Quickfire'});
        if(this.port) {
            console.log("Connected successfully.")
            this.port.onMessage.addListener(this.handleRemoteDebugMessage.bind(this));
        }
        /*
        this.commandServer = new WebSocket("ws://localhost:8999");
        this.commandServer.onmessage = this.handleRemoteDebugMessage;
        this.commandServer.onopen = this.commandServerOpen;
        this.commandServer.onerror = this.commandServerError;
        this.commandServer.onclose = this.commandServerClose;
        */

    }

    this.handleRemoteDebugMessage = function(_message) {

        console.log("Handling Chrome extension message ", _message);

        var message = JSON.parse(_message.substr(1, _message.length-1));
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

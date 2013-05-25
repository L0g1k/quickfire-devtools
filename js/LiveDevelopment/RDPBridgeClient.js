function RDPBridgeClient() {

    var self = this;

    var Messages = {
        ON_CONNECT: 1
    };

    this.connect = function(tabId, port) {
        this.tabId = tabId;
        this.postMessage(tabId, "chrome.extension.onConnect", {port: { name: port.name }});
    }

    this.handleRemoteDebugMessage = function(request) {
        console.log("Handing RDP message to tab " + this.tabId  + request);
    }

    this.init = function() {
        this.commandServer = new WebSocket("ws://localhost:8999");
        this.commandServer.onmessage = this.handleRemoteDebugMessage.bind(this);
    }

    this.onMessage = function(message) {

    }

    this.postMessage = function(id, method) {
        this.postMessage(id, method, undefined);
    }

    this.postMessage = function(id, method, params) {
        this.commandServer.send(message);
    }

    try {
        this.init();
    } catch (e) {
        console.error("Couldn't connect to RDP Bridge Server");
    }
}

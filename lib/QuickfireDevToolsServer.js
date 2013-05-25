function QuickfireDevToolsServer() {
    this.webSocket = new WebSocketServer(9000, "127.0.0.1");
}
QuickfireDevToolsClient.prototype.sendMessage = function (devToolsMessage) {
    this.webSocket.send(devToolsMessage);
}

QuickfireDevToolsClient.prototype.broadcastResourceChanged = function (url, content) {
    this.sendMessage(new DevToolsMessage('quickfire.setResourceContent', {
        url: url, content: content
    })) ;
}




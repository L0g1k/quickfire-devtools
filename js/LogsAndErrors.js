// Testing


var debug = true;
var testCSS = "body { background-color: red; color: blue }";

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

// Useful for debugging. Messages sent to this function can be expected to be logged in the extension's background page.
function logMessageInBackgroundPage(messageString, /* optional */ messageObject) {
    if(!debug)
        return;
    notifyBackground({
        messageKey: 'chrome.devtools.logMessage',
        message: messageString,
        messageObject: messageObject
    });
}
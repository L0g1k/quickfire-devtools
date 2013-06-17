var chromeApp = true;

function onMessage(message) {

    logMessageInBackgroundPage("Devtools: message received " + message);

    switch(message.messageKey) {
        case 'quickfire.setResourceContent':
            supressEvents = true;
            setResourceContent(message.content.url, message.content.content);
            break;
        case 'quickfire.marco' : polo(); break;
    }
}

// Notify the script living inside the actual webpage. These extension scripts can't directly access anything.
function notifyQuickfire(payload) {
    var target = chromeApp ? webSocket.send : port.postMessage
    target.postMessage({
        rx: 'quickfire',
        payload: payload
    });
}

// Notify the extension 'hub'
function notifyBackground(payload) {
    // This is in fact the same between the two modes. We just need something from the background page.
    port.postMessage({
        rx: 'background',
        payload: payload
    });
}

// Tell anyone interested that we are here
function polo() {
    notifyQuickfire("chrome.devtools.polo");
}
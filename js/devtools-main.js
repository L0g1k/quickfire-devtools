'use strict';

var resources = [];
// If we are setting the resource content because quickfire told us to, then we don't want to fire an onResourceContentComitted event.
var supressEvents = false;

//disconnected();
logMessageInBackgroundPage("DevTools opened; extension code initialising");

notifyBackground({
    messageKey: 'chrome.devtools.init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

chrome.devtools.panels.create("pixelJET",
    "icon_32.png",
    "images.html",
    function(panel) {
        panel.createStatusBarButton('cloud19.png', 'something about clouds', false);
});

chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
    chrome.devtools.inspectedWindow.eval("window.qf.onSelectionChanged($0)", function (res) {
        notifyQuickfire("chrome.devtools.panels.elements.onSelectionChanged");
    });
});

// An incoming change event from the DevTools. Like in the CSS panel, or the CSS or JS code editor. HTML changes
// can't be made through DevTools so they won't come here.
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(event, content) {

    // Don't notify quickfire about the event that it just sent us.
    if(supressEvents) supressEvents = false; else try {

        notifyQuickfire("chrome.devtools.inspectedWindow.onResourceContentCommitted", {
            url: event.url,
            type: event.type,
            content: content
        });

    } catch (e) {
        console.error(e);
    }
});

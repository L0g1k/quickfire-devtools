function setResourceContent(url, content) {

    var found = false;
    if(debug)
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
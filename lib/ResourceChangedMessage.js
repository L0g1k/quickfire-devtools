function ResourceChangedMessage(file) {
    DevToolsMessage.constructor.call('quickfire.setResourceContent', {
        url: file.getName(), content: file.getContent
    });
}


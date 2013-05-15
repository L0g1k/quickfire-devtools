quickfire-devtools
==================

Managed hotswapping of CSS and JavaScript (but not HTML) code through the Chrome DevTools.

Communication is done through posting messages (ie: strings) and the DevTools must be manually opened by the user
before the hotswapping can work; thus much of the code is communications plumbing and status checking / logging.

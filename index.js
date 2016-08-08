/**
 * Starts up a proxy server which modifies calls between the test process
 * and the selenium server.
 */

var BlockingProxy = require('./built/lib/blockingproxy').BlockingProxy;

var proxy = new BlockingProxy();
proxy.listen(8111);

import * as http from 'http';
import * as url from 'url';
var angularWaits = require('./angular/wait.js');

var WAIT_FOR_ANGULAR_DATA = JSON.stringify({
  script : 'return (' + angularWaits.NG_WAIT_FN + ').apply(null, arguments);',
  args : []
});

/**
 * The stability proxy is an http server responsible for intercepting
 * JSON webdriver commands. It keeps track of whether the page under test
 * needs to wait for page stability, and initiates a wait if so.
 */
export class BlockingProxy {
  seleniumAddress: string;
  stabilityEnabled: boolean;
  server: http.Server;
  
  constructor(seleniumAddress) {
    this.seleniumAddress = seleniumAddress;
    this.stabilityEnabled = true;
    this.server = http.createServer(this.requestListener.bind(this));

  }

    /**
     * This command is for the proxy server, not to be forwarded to Selenium.
     */
    static isProxyCommand(commandPath: string) {
      return (commandPath.split('/')[1] === 'stabilize_proxy');
    }

    /**
     * Create the WebDriver protocol URL for the executeAsync command.
     *
     * @param {string} originalUrl The URL from the incoming command.
     */
    static executeAsyncUrl(originalUrl: string) {
      var parts = originalUrl.split('/');
      return [ parts[0], parts[1], parts[2], 'execute_async' ].join('/');
    }

    /**
     * Return true if the requested method should trigger a stabilize first.
     *
     * @param {string} commandPath Original request url.
     */
    shouldStabilize(commandPath) {
      if (!this.stabilityEnabled) {
        return false;
      }

      if (BlockingProxy.isProxyCommand(commandPath)) {
        return false;
      }

      // TODO - should this implement some state, and be smart about whether
      // stabilization is necessary or not? Would that be as simple as GET/POST?
      // e.g. two gets in a row don't require a wait btwn.
      //
      // See https://code.google.com/p/selenium/wiki/JsonWireProtocol for
      // descriptions of the paths.
      // We shouldn't stabilize if we haven't loaded the page yet.
      var parts = commandPath.split('/');
      if (parts.length < 4) {
        return false;
      }

      var commandsToWaitFor = [
        'execute', 'execute_async', 'screenshot', 'source', 'title', 'element',
        'elements', 'keys', 'moveto', 'click', 'buttondown', 'buttonup',
        'doubleclick', 'touch'
      ];

      if (commandsToWaitFor.indexOf(parts[3]) != -1) {
        return true;
      }
      return false;
    }

    /**
     * Creates a request to forward to the Selenium server. The request stream will
     * not be ended - the user will need to write any data and then call `.end`.
     *
     * @param {string} method
     * @param {string} messageUrl
     * @param {function(http.IncomingMessage)} callback
     *
     * @return {http.ClientRequest}
     */
    createSeleniumRequest(method, messageUrl, callback) {
      var parsedUrl = url.parse(this.seleniumAddress);
      var options = {};
      options['method'] = method;
      options['path'] = parsedUrl.path + messageUrl;
      options['hostname'] = parsedUrl.hostname;
      options['port'] = parsedUrl.port;

      var request = http.request(options, callback);

      return request;
    };

    handleProxyCommand(message, data, response) {
      var command = message.url.split('/')[2];
      switch (command) {
      case 'enabled':
        if (message.method === 'GET') {

        } else if (message.method === 'POST') {

        } else {
          response.writeHead(405);
          response.write('Invalid method');
          response.end();
        }
        break;
      case 'selenium_address':
        if (message.method === 'GET') {
          response.writeHead(200);
          response.write(JSON.stringify({value : this.seleniumAddress}));
          response.end();
        } else if (message.method === 'POST') {
          response.writeHead(200);
          this.seleniumAddress = JSON.parse(data).value;
          response.end();
        } else {
          response.writeHead(405);
          response.write('Invalid method');
          response.end();
        }
        break;
      default:
        response.writeHead(404);
        response.write('Unknown stabilizer proxy command');
        response.end();
      }
    }

    sendRequestToStabilize(originalRequest) {
      let stablePromise = new Promise((resolve, reject) => {
        console.log('Waiting for stability...', originalRequest.url);
        var stabilityRequest = this.createSeleniumRequest(
          'POST', BlockingProxy.executeAsyncUrl(originalRequest.url),
          function(stabilityResponse) {
            // TODO - If the response is that angular is not available on the page,
            // should we just go ahead and continue?
            let stabilityData = '';
            stabilityResponse.on('data', function(data) { stabilityData += data; });

            stabilityResponse.on('error', function(err) {
              console.log(err);
              reject(err);
            });

            stabilityResponse.on('end', function() {
              var value = JSON.parse(stabilityData).value;
              if (value) {
                // waitForAngular only returns a value if there was an error
                // in the browser.
                value = 'Error while waiting for page to stabilize: ' + value;
                console.log(value);
                reject(value);
                return;
              }
              console.log('Stabilized');
              resolve();
            });
          });
        stabilityRequest.write(WAIT_FOR_ANGULAR_DATA);
        stabilityRequest.end();
      });

      return stablePromise;
    }

    requestListener(originalRequest: http.IncomingMessage, response: http.ServerResponse) {
      if (BlockingProxy.isProxyCommand(originalRequest.url)) {
        this.handleProxyCommand(originalRequest, "", response);
        return;
      }

      // If the command is not a proxy command, it's a regular webdriver command.
      console.log(originalRequest.url);

      if (this.shouldStabilize(originalRequest.url)) {
        this.sendRequestToStabilize(originalRequest)
          .then(() => {
            var seleniumRequest = this.createSeleniumRequest(
              originalRequest.method, originalRequest.url,
              (seleniumResponse) => {
                response.writeHead(seleniumResponse.statusCode,
                  seleniumResponse.headers);
                seleniumResponse.pipe(response);
              });
            originalRequest.pipe(seleniumRequest);
          },
          function (err) {
            response.writeHead(500);
            response.write(err);
            response.end();
          });
      }
    }

    listen(port: number) {
      console.log('Blocking proxy listening on port ' + port);
      this.server.listen(port);
    }

}


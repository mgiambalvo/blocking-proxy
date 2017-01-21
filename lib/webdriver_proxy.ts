import {parseWebDriverCommand} from './webdriverCommands';

/**
 * A proxy that understands WebDriver commands. Users can add middleware (similar to middleware in
 * express) that will be called before
 * forwarding the request to WebDriver or forwarding the response to the client.
 */
export class WebdriverProxy {

  constructor() {

  }

  addMiddleware(middleware: WebDriverMiddleware) {

  }

  requestListener(originalRequest: http.IncomingMessage, response: http.ServerResponse) {


    let stabilized = Promise.resolve(null);

    // If the command is not a proxy command, it's a regular webdriver command.
    if (self.shouldStabilize(originalRequest.url)) {
      stabilized = self.sendRequestToStabilize(originalRequest);

      // TODO: Log waiting for Angular.
    }

    stabilized.then(
        () => {
          let seleniumRequest = self.createSeleniumRequest(
              originalRequest.method, originalRequest.url, function(seleniumResponse) {
                response.writeHead(seleniumResponse.statusCode, seleniumResponse.headers);
                seleniumResponse.pipe(response);
                seleniumResponse.on('error', (err) => {
                  response.writeHead(500);
                  response.write(err);
                  response.end();
                });
              });
          let reqData = '';
          originalRequest.on('error', (err) => {
            response.writeHead(500);
            response.write(err);
            response.end();
          });
          originalRequest.on('data', (d) => {
            reqData += d;
            seleniumRequest.write(d);
          });
          originalRequest.on('end', () => {
            let command =
                parseWebDriverCommand(originalRequest.url, originalRequest.method, reqData);
            if (this.logger) {
              this.logger.logWebDriverCommand(command);
            }
            seleniumRequest.end();
          });
        },
        (err) => {
          response.writeHead(500);
          response.write(err);
          response.end();
        });
  }
}

export class WebDriverMiddleware {
  onRequest() {
  }
}
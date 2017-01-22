import {parseWebDriverCommand, WebDriverCommand} from './webdriver_commands';
import * as http from 'http';
import * as url from 'url';

/**
 * A proxy that understands WebDriver commands. Users can add middleware (similar to middleware in
 * express) that will be called before
 * forwarding the request to WebDriver or forwarding the response to the client.
 */
export class WebDriverProxy {
  barriers: WebDriverBarrier[];
  seleniumAddress: string;

  constructor(seleniumAddress: string) {
    this.barriers = [];
    this.seleniumAddress = seleniumAddress;
  }

  addBarrier(barrier: WebDriverBarrier) {
    this.barriers.push(barrier);
  }

  async requestListener(originalRequest: http.IncomingMessage, response: http.ServerResponse) {

    let command = parseWebDriverCommand(originalRequest.url, originalRequest.method);

    let reqData = '';
    originalRequest.on('data', (d) => {
      reqData += d;
    });
    originalRequest.on('end', () => {
      command.handleData(reqData);
    });

    // TODO: What happens when barriers error? return a client error?
    for (let barrier of this.barriers) {
      await barrier.onCommand(command);
    }

    let parsedUrl = url.parse(this.seleniumAddress);
    let options: http.RequestOptions = {};
    options.method = originalRequest.method;
    options.path = parsedUrl.path + originalRequest.url;
    options.hostname = parsedUrl.hostname;
    options.port = parseInt(parsedUrl.port);
    options.headers = originalRequest.rawHeaders;

    originalRequest.on('error', (err) => {
      response.writeHead(500);
      response.end(err);
    });

    let forwardedRequest = http.request(options, (seleniumResponse) => {
      response.writeHead(seleniumResponse.statusCode, seleniumResponse.headers);
      let respData = '';
      seleniumResponse.on('data', (d) => {
        respData += d;
        response.write(d);
      });
      seleniumResponse.on('end', () => {
        command.handleResponse(seleniumResponse.statusCode, respData);
        response.end();
      });
      seleniumResponse.on('error', (err) => {
        response.writeHead(500);
        response.end(err);
      });
    });

    originalRequest.on('data', (d) => {
      forwardedRequest.write(d);
    });
    originalRequest.on('end', () => {
      forwardedRequest.end();
    });
  }
}

export interface WebDriverBarrier {
  onCommand(command: WebDriverCommand): Promise<void>;
}
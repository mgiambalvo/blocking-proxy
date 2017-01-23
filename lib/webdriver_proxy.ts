import * as http from 'http';
import * as url from 'url';

import {parseWebDriverCommand, WebDriverCommand} from './webdriver_commands';

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

  requestListener(originalRequest: http.IncomingMessage, response: http.ServerResponse) {
    let command = parseWebDriverCommand(originalRequest.url, originalRequest.method);

    let replyWithError = (err) => {
      response.writeHead(500);
      response.write(err.toString());
      response.end();
    };

    // TODO: What happens when barriers error? return a client error?
    let barrierPromises = this.barriers.map((b) => b.onCommand(command));

    Promise.all(barrierPromises).then(() => {
      let parsedUrl = url.parse(this.seleniumAddress);
      let options: http.RequestOptions = {};
      options.method = originalRequest.method;
      options.path = parsedUrl.path + originalRequest.url;
      options.hostname = parsedUrl.hostname;
      options.port = parseInt(parsedUrl.port);
      options.headers = originalRequest.headers;

      let forwardedRequest = http.request(options);

      // clang-format off
      let reqData = '';
      originalRequest.on('data', (d) => {
        reqData += d;
        forwardedRequest.write(d);
      }).on('end', () => {
        command.handleData(reqData);
        forwardedRequest.end();
      }).on('error', replyWithError);

      forwardedRequest.on('response', (seleniumResponse) => {
        response.writeHead(seleniumResponse.statusCode, seleniumResponse.headers);

        let respData = '';
        seleniumResponse.on('data', (d) => {
          respData += d;
          response.write(d);
        }).on('end', () => {
          command.handleResponse(seleniumResponse.statusCode, respData);
          response.end();
        }).on('error', replyWithError);

      }).on('error', replyWithError);
      // clang-format on

    }, replyWithError);
  }
}

export interface WebDriverBarrier { onCommand(command: WebDriverCommand): Promise<void>; }
/* A fake selenium webdriver server to make testing easier. */
import * as http from 'http';

export class FakeServer {
  server: http.Server;

  nextResponse = FakeServer.CHROME_NEW_SESSION_RESPONSE;

  constructor(port: number) {
    this.server = http.createServer(this.requestListener.bind(this));
    this.server.listen(port);
  }

  requestListener(request: http.IncomingMessage, response: http.ServerResponse) {
    let body = '';
    request.on("data", (data) => {
      body += data;
    });

    request.on("end", () => {
      console.log('Got request: ', request.url, JSON.parse(body));
      response.writeHead(200);

      response.write(this.nextResponse);
      response.end();
    });
  }

  sendFakeClick() {

  }

  static SESSION_ID = "8926113f-e79d-472b-93a2-63265e6744f4";

  static CHROME_NEW_SESSION_RESPONSE = `{
    "state": null,
    "sessionId": "${FakeServer.SESSION_ID}",
    "hCode": 298642512,
    "value": {
      "applicationCacheEnabled": false,
      "rotatable": false,
      "mobileEmulationEnabled": false,
      "networkConnectionEnabled": false,
      "chrome": {
        "chromedriverVersion": "2.24.417412 (ac882d3ce7c0d99292439bf3405780058fcca0a6)",
        "userDataDir": "/var/folders/wq/fs2fl16114sdrxbtvc0fhssm00693v/T/.org.chromium.Chromium.ShCCXc"
      },
      "takesHeapSnapshot": true,
      "pageLoadStrategy": "normal",
      "databaseEnabled": false,
      "handlesAlerts": true,
      "hasTouchScreen": false,
      "version": "54.0.2840.71",
      "platform": "MAC",
      "browserConnectionEnabled": false,
      "nativeEvents": true,
      "acceptSslCerts": true,
      "webdriver.remote.sessionid": "${FakeServer.SESSION_ID}",
      "locationContextEnabled": true,
      "webStorageEnabled": true,
      "browserName": "chrome",
      "takesScreenshot": true,
      "javascriptEnabled": true,
      "cssSelectorsEnabled": true
    },
    "class": "org.openqa.selenium.remote.Response",
    "status": 0
  }`;

  static EXECUTE_ASYNC_RESPONSE = `{
    "state": "success",
    "sessionId": "2d7e4604-9e37-4db4-bc16-e457693c21bc",
    "hCode": 486916578,
    "value": null,
    "class": "org.openqa.selenium.remote.Response",
    "status": 0
  }`;

}
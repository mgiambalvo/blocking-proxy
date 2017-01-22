import * as http from 'http';
import {Server} from 'selenium-mock';
import * as webdriver from 'selenium-webdriver';

import {WebDriverCommand} from '../../lib/webdriver_commands';
import {WebDriverBarrier, WebDriverProxy} from '../../lib/webdriver_proxy';
import {getMockSelenium, Session} from '../helpers/mock_selenium';

class TestBarrier implements WebDriverBarrier {
  commands: WebDriverCommand[] = [];

  onCommand(command: WebDriverCommand): Promise<void> {
    this.commands.push(command);
    return undefined;
  }
}

describe('WebDriver Proxy', () => {
  let mockServer: Server<Session>;
  let driver: webdriver.WebDriver;
  let proxy: WebDriverProxy;
  let server: http.Server;

  beforeEach(() => {
    mockServer = getMockSelenium();
    mockServer.start();
    let mockPort = mockServer.handle.address().port;

    proxy = new WebDriverProxy(`http://localhost:${mockPort}/wd/hub`);
    proxy.addBarrier(new TestBarrier());
    server = http.createServer(proxy.requestListener.bind(proxy));
  });

  it('forwards requests to WebDriver',
     () => {
     });

  it('waits for filters',
     () => {

     });

  it('filters can insert webdriver commands',
     () => {

     });

  it('calls filters with webdriver responses',
     () => {

     });

  it('propagates http errors',
     () => {

     });

  it('propagates headers to selenium',
     () => {

     });
});
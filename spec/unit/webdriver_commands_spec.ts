import * as http from 'http';
import {Server} from 'selenium-mock';
import * as webdriver from 'selenium-webdriver';

import {WebDriverCommand} from '../../lib/webdriver_commands';
import {WebDriverBarrier, WebDriverProxy} from '../../lib/webdriver_proxy';
import {getMockSelenium, Session} from '../helpers/mock_selenium';


const capabilities = webdriver.Capabilities.chrome();

class TestBarrier implements WebDriverBarrier {
  commands: WebDriverCommand[] = [];

  onCommand(command: WebDriverCommand): Promise<void> {
    return undefined;
  }
}

describe('WebDriver command parser', () => {
  let mockServer: Server<Session>;
  let driver: webdriver.WebDriver;
  let proxy: WebDriverProxy;
  let bpPort: number;
  let server: http.Server;

  beforeAll(async() => {
    mockServer = getMockSelenium();
    mockServer.start();
    let mockPort = mockServer.handle.address().port;

    proxy = new WebDriverProxy(`http://localhost:${mockPort}/wd/hub`);
    server = http.createServer(proxy.requestListener.bind(proxy));

    driver = new webdriver.Builder()
                 .usingServer(`http://localhost:${bpPort}`)
                 .withCapabilities(capabilities)
                 .build();

    // Ensure WebDriver client has created a session by waiting on a command.
    await driver.get('http://example.com');
  });

  afterEach(() => {});

  xit('handles session commands', async() => {
    let session = await driver.getSession();
  });

  xit('handles url commands', async() => {});

  afterAll(() => {
    mockServer.stop();
  });
});

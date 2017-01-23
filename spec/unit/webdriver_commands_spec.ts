import * as http from 'http';
import {Server} from 'selenium-mock';
import * as webdriver from 'selenium-webdriver';

import {CommandName} from '../../lib/webdriver_commands';
import {WebDriverProxy} from '../../lib/webdriver_proxy';
import {getMockSelenium, Session} from '../helpers/mock_selenium';
import {TestBarrier} from './util';

describe('WebDriver command parser', () => {
  let mockServer: Server<Session>;
  let driver: webdriver.WebDriver;
  let proxy: WebDriverProxy;
  let server: http.Server;
  let testBarrier: TestBarrier;

  beforeEach(async() => {
    mockServer = getMockSelenium();
    mockServer.start();
    let mockPort = mockServer.handle.address().port;

    proxy = new WebDriverProxy(`http://localhost:${mockPort}/wd/hub`);
    testBarrier = new TestBarrier;
    proxy.addBarrier(testBarrier);
    server = http.createServer(proxy.handleRequest.bind(proxy));
    server.listen(0);
    let port = server.address().port;

    driver = new webdriver.Builder()
                 .usingServer(`http://localhost:${port}`)
                 .withCapabilities(webdriver.Capabilities.chrome())
                 .build();

    // Ensure WebDriver client has created a session by waiting on a command.
    await driver.get('http://example.com');
  });

  it('parses session commands', async() => {
    let session = await driver.getSession();
    let sessionId = session.getId();
    await driver.quit();

    let recentCommands = testBarrier.getCommandNames();
    expect(recentCommands.length).toBe(3);
    expect(recentCommands).toEqual([
      CommandName.NewSession, CommandName.Go, CommandName.DeleteSession
    ]);
    expect(testBarrier.commands[1].sessionId).toEqual(sessionId);
  });

  it('parses url commands', async() => {
    await driver.getCurrentUrl();
    await driver.navigate().back();
    await driver.navigate().forward();
    await driver.navigate().refresh();
    await driver.getTitle();

    let recentCommands = testBarrier.getCommandNames();
    expect(recentCommands.length).toBe(7);
    expect(recentCommands).toEqual([
      CommandName.NewSession,
      CommandName.Go,
      CommandName.GetCurrentURL,
      CommandName.Back,
      CommandName.Forward,
      CommandName.Refresh,
      CommandName.GetTitle
    ]);
  });

  it('parses timeout commands', async() => {
    await driver.manage().timeouts().setScriptTimeout(2468);

    let recentCommands = testBarrier.getCommandNames();
    expect(recentCommands[2]).toEqual(CommandName.SetTimeouts);
    let timeoutData = testBarrier.commands[2].data;
    expect(timeoutData['ms']).toEqual(2468);
  });

  it('parses window commands', async() => {
    let handle = await driver.getWindowHandle();

    let data = testBarrier.commands[2].responseData;
    expect(data['value']).toEqual(7);
  });

  afterEach(() => {
    server.close();
    mockServer.stop();
  });
});

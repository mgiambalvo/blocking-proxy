import {Server} from 'selenium-mock';
import * as webdriver from 'selenium-webdriver';
import * as stream from 'stream';

import {BlockingProxy} from '../../lib/blockingproxy';
import {WebDriverLogger} from '../../lib/webdriver_logger';
import {getMockSelenium, Session} from '../helpers/mock_selenium';
import {parseWebDriverCommand} from '../../lib/webdriver_commands';

const capabilities = webdriver.Capabilities.chrome();

/**
 * For testing purposes, create a logger that logs to an in-memory buffer, instead of to disk.
 */
class InMemoryLogger extends WebDriverLogger {
  logs: string[];

  constructor() {
    super();
    this.logs = [];
  }

  public setLogDir(logDir: string) {
    let self = this;
    this.logStream = new stream.Writable({
      write(chunk, enc, next) {
        self.logs.push(chunk.toString());
        next();
      }
    });
  }

  public reset() {
    this.logs = [];
  }

  public getLog() {
    return this.logs;
  }
}

fdescribe('WebDriver logger', () => {
  let mockServer: Server<Session>;
  let driver: webdriver.WebDriver;
  let logger = new InMemoryLogger();
  let proxy: BlockingProxy;
  let bpPort: number;

  beforeAll(() => {
    mockServer = getMockSelenium();
    mockServer.start();
    let mockPort = mockServer.handle.address().port;

    proxy = new BlockingProxy(`http://localhost:${mockPort}/wd/hub`);
    proxy.waitEnabled = false;
    bpPort = proxy.listen(0);
    logger.setLogDir('.');
    proxy.setLogger(logger);
  });

  beforeEach(async() => {
    driver = new webdriver.Builder()
                 .usingServer(`http://localhost:${bpPort}`)
                 .withCapabilities(capabilities)
                 .build();

    // Ensure WebDriver client has created a session by waiting on a command.
    await driver.get('http://example.com');
  });

  afterEach(() => {
    logger.reset();
  });

  it('creates logfiles with unique names', () => {
    let otherLogger = new InMemoryLogger();

    expect(logger.logName).not.toEqual(otherLogger.logName);
  });

  it('logs session commands', async() => {
    let session = await driver.getSession();
    let shortSession = session.getId().slice(0, 6);
    await driver.quit();

    let log = logger.getLog();
    expect(log[0]).toContain('NewSession');
    expect(log[0]).toContain(shortSession);
    expect(log[3]).toContain('DeleteSession');
    expect(log[3]).toContain(shortSession);
  });

  it('logs url commands', async() => {
    await driver.getCurrentUrl();

    let log = logger.getLog();
    expect(log[0]).toContain('NewSession');
    expect(log[1]).toContain('chrome');
    expect(log[2]).toContain('Go http://example.com');
  });

  fit('parses commands that affect elements', async() => {
    let session = await driver.getSession()
    let shortSession = session.getId().slice(0, 6);
    logger.reset();
    jasmine.clock().install();
    let start = new Date('2017-01-26T22:05:34.000Z');
    jasmine.clock().mockDate(start)

    let el = driver.findElement(webdriver.By.css('.test'));
    await el.click();
    await el.clear();
    await el.sendKeys('test string');

    let inner = el.findElement(webdriver.By.css('.inner_thing'));
    await inner.click();

    await driver.findElements(webdriver.By.id('thing'));
    await el.findElements(webdriver.By.css('.inner_thing'));
    jasmine.clock().uninstall();

    let log = logger.getLog();
    let expectedLog = [
      `[14:05:34.000] | ${shortSession} | 0s | FindElement\n`,
      `    Using css selector '.test'\n`,
      `    Elements: 0\n`,
      `[14:05:34.000] | ${shortSession} | 0s | ElementClick (0)\n`,
      `[14:05:34.000] | ${shortSession} | 0s | ElementClear (0)\n`,
      `[14:05:34.000] | ${shortSession} | 0s | ElementSendKeys (0)\n`,
      `    Send: test string\n`,
      `[14:05:34.000] | ${shortSession} | 0s | FindElementFromElement (0)\n`,
      `    Using css selector '.inner_thing'\n`,
      `    Elements: 0\n`,
      `[14:05:34.000] | ${shortSession} | 0s | ElementClick (0)\n`,
      `[14:05:34.000] | ${shortSession} | 0s | FindElements\n`,
      `    Using css selector '*[id=\"thing\"]'\n`,
      `    Elements: 0,1\n`,
      `[14:05:34.000] | ${shortSession} | 0s | FindElementsFromElement (0)\n`,
      `    Using css selector '.inner_thing'\n`,
      `    Elements: 0,1\n`,
    ];
    for (let line in expectedLog) {
      expect(log[line]).toEqual(expectedLog[line],
          `Expected line: ${line} to match`);
    }
    console.log(log);
  });

  it('parses commands that read elements', async() => {
    logger.reset();
    let session = await driver.getSession()
    let shortSession = session.getId().slice(0, 6);

    jasmine.clock().install();
    let start = new Date('2017-01-26T22:05:34.000Z');
    jasmine.clock().mockDate(start)

    let el = driver.findElement(webdriver.By.css('.test'));
    await el.getCssValue('color');
    await el.getAttribute('id');
    await el.getTagName();
    await el.getText();
    await el.getSize();

    let log = logger.getLog();

    console.log(log);
    let expectedLog = [
        `[14:05:34.000] | ${shortSession} | 0s | FindElement\n`,
        `    {"using":"css selector","value":".test"}\n`,
        `    {"ELEMENT":"0"}\n`,
        `[14:05:34.000] | ${shortSession} | 0s | GetElementCSSValue\n`,
        `    undefined\n`,
        `[14:05:34.000] | ${shortSession} | 0s | GetElementAttribute\n`,
        `    undefined\n`,
        `[14:05:34.000] | ${shortSession} | 0s | GetElementTagName\n`,
        `    undefined\n`,
        `[14:05:34.000] | ${shortSession} | 0s | GetElementText\n`,
        `    undefined\n`,
        `[14:05:34.000] | ${shortSession} | 0s | GetElementRect\n`
    ];
    for (let line in expectedLog) {
      expect(log[line]).toEqual(expectedLog[line],
        `Expected line: ${line} to match`);
    }
  });

  it('logs response errors', () => {
    let cmd = parseWebDriverCommand('/session/abcdef/url', 'GET');

    logger.logWebDriverCommand(cmd);
    cmd.handleResponse(500, {'state': 'Selenium Error'});

    let log = logger.getLog();
    expect(log[4]).toContain('ERROR: Selenium Error');
  });

  it('shows how long commands take', async() => {
    jasmine.clock().install();

    let cmd = parseWebDriverCommand('/session/abcdef/url', 'GET');

    let start = new Date('2017-01-26T22:05:34.000Z');
    jasmine.clock().mockDate(start)
    logger.logWebDriverCommand(cmd);

    let delay = new Promise((res) => setTimeout(() => {
      cmd.handleResponse(200, {});
      res();
    }, 1234));

    jasmine.clock().tick(2000);
    await delay;

    let log = logger.getLog();
    expect(log[3]).toContain('[14:05:34.000] | abcdef | 1.234s | GetCurrentURL');

    jasmine.clock().uninstall();
  });

  afterAll(() => {
    mockServer.stop();
  });
});

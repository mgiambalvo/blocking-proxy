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

  fit('parses element commands', async() => {
    let el = driver.findElement(webdriver.By.css('.test'));
    await el.click();
    await el.getCssValue('fake-color');
    await el.getAttribute('fake-attr');
    await el.getTagName();
    await el.getText();
    await el.getSize();
    await el.clear();
    await el.sendKeys('test string');

    let inner = el.findElement(webdriver.By.css('.inner_thing'));
    await inner.click();

    await driver.findElements(webdriver.By.id('thing'));
    await el.findElements(webdriver.By.css('.inner_thing'));
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

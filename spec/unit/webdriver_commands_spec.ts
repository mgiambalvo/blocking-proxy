import {Server} from 'selenium-mock';
import * as webdriver from 'selenium-webdriver';

import {BlockingProxy} from '../../lib/blockingproxy';
import {getMockSelenium, Session} from '../helpers/mock_selenium';

const capabilities = webdriver.Capabilities.chrome();

class TestBarrier implements WDBarrier {

}

describe('WebDriver logger', () => {
  let mockServer: Server<Session>;
  let driver: webdriver.WebDriver;
  let proxy: BlockingProxy;
  let bpPort: number;

  beforeAll(() => {
    mockServer = getMockSelenium();
    mockServer.start();
    let mockPort = mockServer.handle.address().port;

    proxy = new BlockingProxy(`http://localhost:${mockPort}/wd/hub`);
    bpPort = proxy.listen(0);
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
  });

  it('parses session commands', async() => {
    let session = await driver.getSession();


  });

  it('parses url commands', async() => {
    await driver.getCurrentUrl();

    let log = logger.getLog();
    expect(log[1]).toContain('Navigating to http://example.com');
    expect(log[2]).toContain('Getting current URL');
  });

  afterAll(() => {
    mockServer.stop();
  });
});

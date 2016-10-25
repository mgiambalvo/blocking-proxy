import {BlockingProxy} from '../../lib/blockingproxy'
import * as webdriver from 'selenium-webdriver';
import {FakeServer} from "./fake_selenium";

describe('BlockingProxy', () => {
  let bp;
  let server;
  let driver;
  const WD_URL = 'http://localhost:3111';

  beforeEach(() => {
    bp = new BlockingProxy(WD_URL);
    bp.listen(8111);

    driver = new webdriver.Builder()
        .usingServer('http://localhost:8111')
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    server = new FakeServer(3111);
  });

  it('should be able to be created', () => {
    expect(bp.waitFunction).toBe('NG_WAIT_FN');
  });

  fit('forwards webdriver commands transparently', (done) => {
    driver.findElement(webdriver.By.css('test')).click().then(() => {
      done();
    });

  });

  xit('waits for stability on click commands', () => {

  });

  xit('returns the right error message on a timeout', () => {
  });
});

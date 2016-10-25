import {BlockingProxy, BPClient} from '../../lib';
import * as webdriver from 'selenium-webdriver';

// Assumes that:
// - a blocking proxy is running at port 8111
// - a selenium standalone is running at port 4444
// - the test application is running at port 8081

describe('blocking proxy', function() {
  let driver: webdriver.WebDriver;
  let bp: BlockingProxy;
  let client: BPClient;

  const BP_PORT = 8111;
  const BP_URL = `http://localhost:${BP_PORT}`;

  beforeAll(() => {
    let capabilities = webdriver.Capabilities.chrome();
    driver = new webdriver.Builder()
        .usingServer(BP_URL)
        .withCapabilities(capabilities)
        .build();
    driver.manage().timeouts().setScriptTimeout(20000);

    bp = new BlockingProxy('http://localhost:4444/wd/hub');
    bp.listen(BP_PORT);

    // TODO set the wait function and arguments.

    client = new BPClient(BP_URL);
  })

  afterAll((done) => {
    bp.quit().then(() => {
      driver.quit();
    }).then(done, done.fail);
  });

  it('should fail when angular is not available', function(done) {
    driver.manage().timeouts().setScriptTimeout(20000);
    driver.get('about:blank');
    driver.executeScript('var x = 20')
        .then(
            function() {
              done.fail('expected driver.execute to fail, but it did not');
            },
            function(err) {
              expect(err).toMatch('window.angular is undefined');
              done();
            });
  }, 10000);
});

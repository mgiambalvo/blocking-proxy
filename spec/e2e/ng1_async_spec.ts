import {BlockingProxy, BPClient} from '../../lib';
import * as webdriver from 'selenium-webdriver';

describe('ng1 synchronizing with slow pages', function() {
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
  });

  afterAll((done) => {
    bp.quit().then(() => {
      driver.quit();
    }).then(done, done.fail);
  });

  beforeEach((done) => {
    driver.get('http://localhost:8081/ng1/#/async').then(() => {
      done();
    });
  });

  function expectText(selector, expectedText) {
    return driver.findElement(webdriver.By.css(selector))
        .getText().then((text) => {
      expect(text).toEqual(expectedText);
    });
  }

  function clickElement(selector) {
    return driver.findElement(webdriver.By.css(selector)).click();
  }

  it('waits for http calls', (done) => {
    expectText('[ng-bind="slowHttpStatus"]', 'not started');

    clickElement('[ng-click="slowHttp()"]');

    expectText('[ng-bind="slowHttpStatus"]', 'done')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('waits for long javascript execution', (done) => {
    expectText('[ng-bind="slowFunctionStatus"]', 'not started');

    clickElement('[ng-click="slowFunction()"]');

    expectText('[ng-bind="slowFunctionStatus"]', 'done')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('DOES NOT wait for timeout', (done) => {
    expectText('[ng-bind="slowTimeoutStatus"]', 'not started');

    clickElement('[ng-click="slowTimeout()"]');

    expectText('[ng-bind="slowTimeoutStatus"]', 'pending...')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('waits for $timeout', (done) => {
    expectText('[ng-bind="slowAngularTimeoutStatus"]', 'not started');

    clickElement('[ng-click="slowAngularTimeout()"]');

    expectText('[ng-bind="slowAngularTimeoutStatus"]', 'done')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('waits for $timeout then a promise', (done) => {
    expectText('[ng-bind="slowAngularTimeoutPromiseStatus"]', 'not started');

    clickElement('[ng-click="slowAngularTimeoutPromise()"]');

    expectText('[ng-bind="slowAngularTimeoutPromiseStatus"]', 'done')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('waits for long http call then a promise', (done) => {
    expectText('[ng-bind="slowHttpPromiseStatus"]', 'not started');

    clickElement('[ng-click="slowHttpPromise()"]');

    expectText('[ng-bind="slowHttpPromiseStatus"]', 'done')
        .then(done).thenCatch(done.fail);
  }, 10000);

  it('waits for slow routing changes', (done) => {
    expectText('[ng-bind="routingChangeStatus"]', 'not started');

    clickElement('[ng-click="routingChange()"]');


    driver.getPageSource().then((source) => {
      expect(source).toMatch('polling mechanism')
      done();
    }).thenCatch(done.fail);
  }, 10000);

  it('waits for slow ng-include templates to load', (done) => {
    expectText('.included', 'fast template contents');

    clickElement('[ng-click="changeTemplateUrl()"]');

    expectText('.included', 'slow template contents')
        .then(done).thenCatch(done.fail);
  }, 10000);
});

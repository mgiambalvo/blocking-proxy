var util = require('util');
var webdriver = require('selenium-webdriver');

describe('synchronizing with slow pages', function() {
  var HOST = 'http://localhost:8081';
  var URL = '/ng1/#/async';

  beforeEach(function() {
    driver.manage().timeouts().setScriptTimeout(20000);
    driver.get(HOST + URL);
  });

  // TODO: Create a common driver session for all e2e tests.
  var driver = new webdriver.Builder()
                   .usingServer('http://localhost:8111')
                   .withCapabilities(webdriver.Capabilities.chrome())
                   .build();

  afterAll(function(done) { driver.quit().then(done, done.fail); });

  function findElement(sel) {
    return driver.findElement(webdriver.By.css(sel));
  }

  function expectText(el, done, expected) {
    return el.getText()
        .then((text) => { expect(text).toEqual(expected); })
        .thenCatch(done.fail);
  }

  it('waits for http calls', function(done) {
    var status = findElement('[ng-bind="slowHttpStatus"]');
    var button = findElement('[ng-click="slowHttp()"]');

    expectText(status, done, 'not started');

    button.click().thenCatch(done.fail);

    expectText(status, done, 'done').then(done);
  }, 10000);

  it('waits for long javascript execution', function(done) {
    var status = findElement('[ng-bind="slowFunctionStatus"]');
    var button = findElement('[ng-click="slowFunction()"]');

    expectText(status, done, 'not started');

    button.click().thenCatch(done.fail);

    expectText(status, done, 'done').then(done);
  }, 10000);

  it('DOES NOT wait for timeout', function(done) {
    var status = findElement('[ng-bind="slowTimeoutStatus"]');
    var button = findElement('[ng-click="slowTimeout()"]');

    expectText(status, done, 'not started');

    button.click().thenCatch(done.fail);

    expectText(status, done, 'pending...').then(done);
  }, 10000);

  it('waits for $timeout', function(done) {
    var status = findElement('[ng-bind="slowAngularTimeoutStatus"]');
    var button = findElement('[ng-click="slowAngularTimeout()"]');

    expectText(status, done, 'not started');

    button.click();

    expectText(status, done, 'done').then(done);
  }, 10000);

  it('waits for $timeout then a promise', function(done) {
    var status = findElement('[ng-bind="slowAngularTimeoutPromiseStatus"]');
    var button = findElement('[ng-click="slowAngularTimeoutPromise()"]');

    expectText(status, done, 'not started');

    button.click();

    expectText(status, done, 'done').then(done);
  }, 10000);

  it('waits for long http call then a promise', function(done) {
    var status = findElement('[ng-bind="slowHttpPromiseStatus"]');
    var button = findElement('[ng-click="slowHttpPromise()"]');

    expectText(status, done, 'not started');

    button.click();

    expectText(status, done, 'done').then(done);
  }, 10000);

  it('waits for slow routing changes', function(done) {
    var status = findElement('[ng-bind="routingChangeStatus"]');
    var button = findElement('[ng-click="routingChange()"]');

    expectText(status, done, 'not started');

    button.click();

    driver.getPageSource()
        .then((source) => { expect(source).toMatch('polling mechanism'); })
        .then(done);
  }, 10000);

  it('waits for slow ng-include templates to load', function(done) {
    var status = findElement('.included');
    var button = findElement('[ng-click="changeTemplateUrl()"]');

    expectText(status, done, 'fast template contents');

    button.click();

    status = findElement('.included');
    expectText(status, done, 'slow template contents').then(done);
  }, 10000);
});

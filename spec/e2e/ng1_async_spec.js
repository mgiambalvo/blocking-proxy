var util = require('util');
var webdriver = require('selenium-webdriver');

var driver = new webdriver.Builder().
  usingServer('http://localhost:8111').
  withCapabilities(webdriver.Capabilities.chrome()).
  build();

xdescribe('synchronizing with slow pages', function() {
  var HOST = 'http://localhost:8081';
  var URL = '/ng1/#/async';

  beforeEach(function() {
    driver.get(HOST + URL);
  });

  function element(el) {
    return driver.findElement(el);
  }

  it('waits for http calls', function() {
    var status = element(webdriver.By.binding('slowHttpStatus'));
    var button = element(webdriver.By.css('[ng-click="slowHttp()"]'));

    /*
    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('done');
    */
  });

  it('waits for long javascript execution', function() {
    var status = element(webdriver.By.binding('slowFunctionStatus'));
    var button = element(webdriver.By.css('[ng-click="slowFunction()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('done');
  });

  it('DOES NOT wait for timeout', function() {
    var status = element(webdriver.By.binding('slowTimeoutStatus'));
    var button = element(webdriver.By.css('[ng-click="slowTimeout()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('pending...');
  });

  it('waits for $timeout', function() {
    var status = element(webdriver.By.binding('slowAngularTimeoutStatus'));
    var button = element(webdriver.By.css('[ng-click="slowAngularTimeout()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('done');
  });

  it('waits for $timeout then a promise', function() {
    var status = element(webdriver.By.binding(
          'slowAngularTimeoutPromiseStatus'));
    var button = element(webdriver.By.css(
          '[ng-click="slowAngularTimeoutPromise()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('done');
  });

  it('waits for long http call then a promise', function() {
    var status = element(webdriver.By.binding('slowHttpPromiseStatus'));
    var button = element(webdriver.By.css('[ng-click="slowHttpPromise()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(status.getText()).toEqual('done');
  });

  it('waits for slow routing changes', function() {
    var status = element(webdriver.By.binding('routingChangeStatus'));
    var button = element(webdriver.By.css('[ng-click="routingChange()"]'));

    expect(status.getText()).toEqual('not started');

    button.click();

    expect(browser.getPageSource()).toMatch('polling mechanism');
  });

  it('waits for slow ng-include templates to load', function() {
    var status = element(webdriver.By.css('.included'));
    var button = element(webdriver.By.css('[ng-click="changeTemplateUrl()"]'));

    expect(status.getText()).toEqual('fast template contents');

    button.click();

    expect(status.getText()).toEqual('slow template contents');
  });
});

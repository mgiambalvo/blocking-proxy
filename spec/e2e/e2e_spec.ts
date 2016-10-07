import {$, browser, by, element} from 'protractor';

// Assumes that:
// - a blocking proxy is running at port 8111
// - a selenium standalone is running at port 4444
// - the test application is running at port 8081

describe('stability proxy', function() {
  beforeAll(() => {
    browser.ignoreSynchronization = true;
    browser.get('index.html#/async');
  })

  var driver = browser.driver;

  it('should get a page with Angular and wait for a slow action',
     function(done) {
       driver.manage().timeouts().setScriptTimeout(20000);
       driver.findElement(by.css('[ng-bind="slowHttpStatus"]'))
           .getText()
           .then(function(text) { expect(text).toEqual('not started'); });
       driver.findElement(by.css('[ng-click="slowHttp()"]')).click();
       driver.findElement(by.css('[ng-bind="slowHttpStatus"]'))
           .getText()
           .then(function(text) {
             expect(text).toEqual('done');
             done();
           })
           .thenCatch(done.fail);
     },
     10000);

  it('should fail when angular is not available', function(done) {
    driver.manage().timeouts().setScriptTimeout(20000);
    driver.get('about:blank');
    driver.executeScript('var x = 20')
        .then(
            function() {
              done.fail('expected driver.execute to fail, but it did not');
            },
            function(err) {
              expect(err).toMatch('angular could not be found on the window');
              done();
            });
  }, 10000);
});

import * as nock from 'nock';

import {CommandName, WebDriverCommand} from '../../lib/webdriver_commands';
import {WebDriverProxy} from '../../lib/webdriver_proxy';

import {InMemoryReader, InMemoryWriter, TestBarrier} from './util';

describe('WebDriver Proxy', () => {
  let proxy: WebDriverProxy;

  beforeEach(() => {
    proxy = new WebDriverProxy(`http://localhost:4444/wd/hub`);
  });

  it('proxies to WebDriver', (done) => {
    let req = new InMemoryReader() as any;
    let resp = new InMemoryWriter() as any;
    resp.writeHead = jasmine.createSpy('spy');
    req.url = '/session/sessionId/get';
    req.method = 'GET';
    const responseData = {value: 'selenium response'};

    let scope = nock(proxy.seleniumAddress).get('/session/sessionId/get').reply(200, responseData);

    proxy.requestListener(req, resp);

    resp.onEnd((data) => {
      // Verify that all nock endpoints were called.
      expect(resp.writeHead.calls.first().args[0]).toBe(200);
      expect(data).toEqual(JSON.stringify(responseData));
      scope.isDone();
      done();
    });
  });

  it('waits for barriers', (done) => {
    const WD_URL = '/session/sessionId/url';

    let req = new InMemoryReader() as any;
    let resp = new InMemoryWriter() as any;
    resp.writeHead = jasmine.createSpy('spy');
    req.url = WD_URL;
    req.method = 'POST';

    let barrier = new TestBarrier();
    let barrierDone = false;
    barrier.onCommand = (): Promise<void> => {
      return new Promise<void>((res) => {
        setTimeout(() => {
          barrierDone = true;
          res();
        }, 250);
      });
    };

    let scope = nock(proxy.seleniumAddress).post(WD_URL).reply(() => {
      // Shouldn't see the command until the barrier is done.
      expect(barrierDone).toBeTruthy();
      return [200];
    });

    proxy.addBarrier(barrier);
    proxy.requestListener(req, resp);

    resp.onEnd(() => {
      expect(barrierDone).toBeTruthy();
      scope.isDone();
      done();
    });
  });

  it('barriers get selenium responses', (done) => {
    const WD_URL = '/session/sessionId/url';
    const RESPONSE = {url: 'http://example.com'};

    let req = new InMemoryReader() as any;
    let resp = new InMemoryWriter() as any;
    resp.writeHead = jasmine.createSpy('spy');
    req.url = WD_URL;
    req.method = 'GET';

    let scope = nock(proxy.seleniumAddress).get(WD_URL).reply(200, RESPONSE);

    let barrier = new TestBarrier();
    barrier.onCommand = (command: WebDriverCommand): Promise<void> => {
      command.on('response', () => {
        expect(command.responseData['url']).toEqual(RESPONSE.url);
        scope.isDone();
        done();
      });
      return undefined;
    };
    proxy.addBarrier(barrier);
    proxy.requestListener(req, resp);
  });

  it('propagates http errors', (done) => {
    const WD_URL = '/session/';
    const ERR = new Error('HTTP error');

    let req = new InMemoryReader() as any;
    let resp = new InMemoryWriter() as any;
    resp.writeHead = jasmine.createSpy('spy');
    req.url = WD_URL;
    req.method = 'POST';

    let scope = nock(proxy.seleniumAddress).post(WD_URL).replyWithError(ERR);

    proxy.requestListener(req, resp);

    resp.onEnd((data) => {
      expect(resp.writeHead.calls.first().args[0]).toBe(500);
      expect(data).toEqual(ERR.toString());
      scope.isDone();
      done();
    });
  });
});
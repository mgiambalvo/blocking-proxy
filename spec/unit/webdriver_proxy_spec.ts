import * as http from 'http';
import * as stream from 'stream';
import * as nock from 'nock';

import {WebDriverProxy} from '../../lib/webdriver_proxy';

class InMemoryWriter extends stream.Writable {
  content: string[];
  doneCb: Function;
  done;

  constructor() {
    super({decodeStrings: true});
    this.content = [];
  }

  _write(chunk: Buffer, encoding?, callback?) {
    let data = chunk.toString();
    this.content.push(data);
    callback();
  }

  onEnd(cb: Function) {
    this.doneCb = cb;
  }

  end() {
    super.end();
    this.doneCb(this.content);
  }
}

class InMemoryReader extends stream.Readable {
  content: string[];
  idx: number;

  constructor() {
    super();
    this.content = []
    this.idx = 0;
  }

  _read() {
    if (this.idx < this.content.length) {
      this.push(this.content[this.idx++]);
    } else {
      this.push(null);
    }
  }
}

fdescribe('WebDriver Proxy', () => {
  let proxy: WebDriverProxy;

  beforeEach(() => {
    proxy = new WebDriverProxy(`http://localhost:4444/wd/hub`);
  });

  fit('proxies to WebDriver', (done) => {
    let req = new InMemoryReader() as any;
    let resp = new InMemoryWriter() as any;
    req.url = '/session/sessionId/get';
    req.method = 'GET';

    resp.writeHead = jasmine.createSpy('spy');

    let scope = nock(proxy.seleniumAddress)
        .get('/session/sessionId/get')
        .reply(500, 'test');

    proxy.requestListener(req, resp);

    resp.onEnd((content) => {
      console.log(content);
      console.log(resp.writeHead.calls.first());
      scope.done();
      done();
    });
  });

  xit('waits for filters', () => {

  });

  xit('filters can insert webdriver commands',
     () => {

     });

  xit('calls filters with webdriver responses',
     () => {

     });

  xit('propagates http errors',
     () => {

     });

  xit('propagates headers to selenium',
     () => {

     });

});
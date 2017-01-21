import * as http from 'http';
import * as url from 'url';
import {BP_PREFIX} from './blockingproxy';

export class BPClient {
  hostname: string;
  port: number;

  constructor(bpUrlValue: string) {
    let bpUrl = url.parse(bpUrlValue);
    this.hostname = bpUrl.hostname;
    this.port = parseInt(bpUrl.port);
  }

  setWaitEnabled(enabled: boolean) {
    return new Promise((resolve, reject) => {
      let options =
          {host: this.hostname, port: this.port, method: 'POST', path: `/${BP_PREFIX}/enabled`};

      let request = http.request(options, (response) => {
        response.on('data', () => {});
        response.on('error', (err) => reject(err));
        response.on('end', () => {
          resolve();
        });
      });
      request.write(JSON.stringify({value: enabled}));
      request.end();
    });
  }

  isWaitEnabled() {
    return new Promise((res) => {
      let options = {host: this.hostname, port: this.port, path: `/${BP_PREFIX}/enabled`};

      http.get(options, (response) => {
        let body = '';
        response.on('data', (data) => {
          body += data;
        });
        response.on('end', () => {
          res(JSON.parse(body).value);
        });
      });
    });
  }
}
import * as stream from 'stream';

import {WebDriverBarrier} from "../../lib/webdriver_proxy";
import {WebDriverCommand, CommandName} from "../../lib/webdriver_commands";

/**
 * Fakes and helpers for testing.
 */
export class TestBarrier implements WebDriverBarrier {
  commands: WebDriverCommand[] = [];

  onCommand(command: WebDriverCommand): Promise<void> {
    this.commands.push(command);
    return;
  }

  getCommandNames(): CommandName[] {
    return this.commands.map((c) => c.commandName);
  }
}

export class InMemoryWriter extends stream.Writable {
  content: string;
  doneCb: Function;

  constructor() {
    super({decodeStrings: true});
    this.content = '';
  }

  _write(chunk: Buffer, encoding?, callback?) {
    let data = chunk.toString();
    this.content += data;
    callback();
  }

  onEnd(cb: Function) {
    this.doneCb = cb;
  }

  end() {
    super.end();
    if (this.doneCb) {
      this.doneCb(this.content);
    }
  }
}

export class InMemoryReader extends stream.Readable {
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

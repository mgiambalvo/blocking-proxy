import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';

import {CommandName, WebDriverCommand} from './webdriver_commands';

// Generate a random 8 character ID to avoid collisions.
function getLogId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36).slice(0, 8);
}

const finderCmds = [CommandName.FindElement, CommandName.FindElementFromElement, CommandName.FindElements, CommandName.FindElementFromElement];
const padding = '    ';

/**
 * Logs WebDriver commands, transforming the command into a user-friendly description.
 */
export class WebDriverLogger {
  logStream: stream.Writable;
  readonly logName: string;

  constructor() {
    this.logName = `webdriver_log_${getLogId()}.txt`;
  }

  /**
   * Start logging to the specified directory. Will create a file named
   * 'webdriver_log_<process id>.txt'
   *
   * @param logDir The directory to create log files in.
   */
  public setLogDir(logDir: string) {
    this.logStream = fs.createWriteStream(path.join(logDir, this.logName), {flags: 'a'});
  }

  /**
   * Logs a webdriver command to the log file.
   *
   * @param command The command to log.
   */
  public logWebDriverCommand(command: WebDriverCommand) {
    if (!this.logStream) {
      return;
    }
    //let cmdLog = this.printCommand(command);

    let logLine: string;
    if (command.getParam('sessionId')) {
      let session = command.getParam('sessionId').slice(0, 6);
      logLine = `${this.timestamp()} | ${session} `;
    } else {
      logLine = `${this.timestamp()} `;
    }

    let started = Date.now();
    command.on('response', () => {
      let done = Date.now();
      let elapsed = (done-started)/1000;
      if (command.commandName == CommandName.NewSession) {
        let session = command.responseData['sessionId'].slice(0, 6);
        logLine += `| ${session} `;
      }
      logLine += `| ${elapsed}s | ${CommandName[command.commandName]}`;
      if (command.commandName == CommandName.Go) {
        logLine += ' ' + command.data['url'];
      }
      logLine += '\n';

      this.logStream.write(logLine);
      this.renderData(command);
      this.renderResponse(command);
    });
  }


  private renderData(command: WebDriverCommand) {
    if (command.commandName == CommandName.NewSession) {
      this.logStream.write(padding + JSON.stringify(command.data['desiredCapabilities']) + '\n');
    } else if (finderCmds.indexOf(command.commandName) !== -1) {
      this.logStream.write(padding + JSON.stringify(command.data) + '\n');
    } else if (command.commandName == CommandName.ElementClick) {
      this.logStream.write(padding + JSON.stringify(command.data));
    }
  }

  private renderResponse(command: WebDriverCommand) {
    if (command.responseStatus != 200) {
      this.logStream.write(padding + `ERROR: ${command.responseData['state']}`);
      return
    }
    if (finderCmds.indexOf(command.commandName) !== -1) {
      this.logStream.write(padding + JSON.stringify(command.responseData['value']));
    }

  }

  /*
  private getFinderForElement() {

  }

  private saveFinderForElement() {

  }
  */

  printCommand(command: WebDriverCommand) {
    switch (command.commandName) {
      case CommandName.NewSession:
        let desired = command.data['desiredCapabilities'];
        return `Getting new "${desired['browserName']}" session`;
      case CommandName.DeleteSession:
        let sessionId = command.getParam('sessionId').slice(0, 6);
        return `Deleting session ${sessionId}`;
      case CommandName.Go:
        return `Navigating to ${command.data['url']}`;
      case CommandName.GetCurrentURL:
        return `Getting current URL`;
      default:
        return `Unknown command ${command.url}`;
    }
  }

  timestamp(): string {
    let d = new Date();
    let hours = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
    let minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    let seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
    let millis = d.getMilliseconds().toString();
    millis = '000'.slice(0, 3 - millis.length) + millis;
    return `[${hours}:${minutes}:${seconds}.${millis}]`;
  }
}

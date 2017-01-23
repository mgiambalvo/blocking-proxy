import {WebDriverBarrier} from "../../lib/webdriver_proxy";
import {WebDriverCommand, CommandName} from "../../lib/webdriver_commands";

/**
 * Fakes and helpers for testing.
 */
export class TestBarrier implements WebDriverBarrier {
  commands: WebDriverCommand[] = [];

  onCommand(command: WebDriverCommand): Promise<void> {
    this.commands.push(command);
    return null;
  }

  getCommandNames(): CommandName[] {
    return this.commands.map((c) => c.commandName);
  }
}



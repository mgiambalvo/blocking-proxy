import {Command, Server, Session as BasicSession} from 'selenium-mock';

export interface Session extends BasicSession { url: string; }

// Go
let setUrl = new Command<Session>('POST', 'url', (session, params) => {
  session.url = params['url'];
});

// Get Current URL
let getUrl = new Command<Session>('GET', 'url', (session, params) => {
  return session.url;
});

// Set Timeout
let setTimeouts = new Command<Session>('POST', 'timeouts', (session, params) => {});

export function getMockSelenium() {
  let server = new Server<Session>(0);
  server.addCommand(setUrl);
  server.addCommand(getUrl);
  server.addCommand(setTimeouts);
  return server;
}

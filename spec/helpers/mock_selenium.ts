import {Command, Server, Session as BasicSession} from 'selenium-mock';

export interface Session extends BasicSession { url: string; }

// Set Timeout
let setTimeouts = new Command<Session>('POST', 'timeouts', (session, params) => {});

// Go
let setUrl = new Command<Session>('POST', 'url', (session, params) => {
  session.url = params['url'];
});

// Get Current URL
let getUrl = new Command<Session>('GET', 'url', (session, params) => {
  return session.url;
});

// Back
let forward = new Command<Session>('POST', 'back', (session, params) => {
});

// Back
let back = new Command<Session>('POST', 'forward', (session, params) => {
});

// refresh
let refresh = new Command<Session>('POST', 'refresh', (session, params) => {
});

// refresh
let title = new Command<Session>('GET', 'title', (session, params) => {
});

// GetWindowHandle
let getWindowHandle = new Command<Session>('GET', 'window_handle', (session, params) => {
  return 7;
});

export function getMockSelenium() {
  let server = new Server<Session>(0);
  server.addCommand(setTimeouts);
  server.addCommand(setUrl);
  server.addCommand(getUrl);
  server.addCommand(back);
  server.addCommand(forward);
  server.addCommand(refresh);
  server.addCommand(title);
  server.addCommand(getWindowHandle);
  return server;
}

# TODO

 - Fix ng2 e2e tests
 - set up travis
 - pass the address to the webdriver server on the commandline
 - configuration via file
 - custom commands to change behavior on the fly
  - enable/disable stability
  - change the stability function
  - Root element for finding testability
  - Whether or not to use All Angular2 roots
  - Timeout
  - Behavior when it times out?
  - Logging level or log to file
 - Http vs https?

Protractor needs to be able to start this in a separate process - it should
work with all the existing methods of starting up webdriver.

Should pass up errors in a reasonable way.

# Running e2e tests
Start webdriver

    webdriver-manager update
    webdriver-manager start

in another terminal, start the testapp

    npm run testapp 

Start the proxy with 
  
    npm start

in yet another terminal, run the tests

    npm run test:e2e

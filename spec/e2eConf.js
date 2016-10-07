var env = require('./environment.js');

// The main suite of Protractor tests.
exports.config = {
  // TODO(heathkit): Replace with something that finds the proxy addr.
  seleniumAddress: 'http://localhost:8111',

  framework: 'jasmine',

  // Spec patterns are relative to this directory.
  specs: [
    'e2e/**/*_spec.ts'
  ],

  capabilities: env.capabilities,

  baseUrl: 'http://localhost:8081/ng1/',

  useAllAngular2AppRoots: true,
  allScriptsTimeout: 120000,
  getPageTimeout: 120000,
  jasmineNodeOpts: {
    defaultTimeoutInterval: 120000
  },
  params: {
    login: {
      user: 'Jane',
      password: '1234'
    }
  },

  beforeLaunch: function() {
    require('ts-node').register({
      project: '.'
    });
  },
};

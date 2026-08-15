const { defineConfig } = require("cypress");

const addFlakyTestAuditTasks = require('./src/tasks.js');

module.exports = defineConfig({
  expose: {
    enableFlakyTestAudit: true, // Master switch to enable or disable flaky test audit
    flakyTestAuditConsoleType: "table", // Console type for displaying flaky test audit: "table" or "list"
    createFlakyTestAuditReport: true, // Enable creation of the flaky test audit report
    testSlownessThreshold: 4000, // Threshold in milliseconds to consider a test as slow
    commandSlownessThreshold: 1000 // Threshold in milliseconds to consider a command as slow
  },

  allowCypressEnv: false,

  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: false,

  retries: {
    runMode: 0,
    openMode: 1,
  },

  e2e: {
    testAuditFolder: 'cypress/reports/flaky-test-audit/',
    setupNodeEvents(on, config) {
      addFlakyTestAuditTasks(on);

      return config;
    },

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'https://sclavijosuero.github.io',
  },
});


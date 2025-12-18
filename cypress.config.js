const { defineConfig } = require("cypress");

const addFlakyTestAuditTasks = require('./src/tasks.js');

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: false,

  testAuditFolder: 'cypress/test-audit',

  retries: {
    runMode: 0,
    openMode: 1,
  },

  e2e: {
    setupNodeEvents(on, config) {
      addFlakyTestAuditTasks(on);

      return config;
    },

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'https://sclavijosuero.github.io',
  },
});

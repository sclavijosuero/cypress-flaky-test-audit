const { defineConfig } = require("cypress");

import addFlakyTestAuditTasks from './src/tasks';

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: false,

  retries: {
    runMode: 1,
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

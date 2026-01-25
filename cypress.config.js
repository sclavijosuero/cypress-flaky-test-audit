const { defineConfig } = require("cypress");
const cypressOnFix = require("cypress-on-fix");

const addFlakyTestAuditTasks = require("./src/tasks.js");

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: false,

  retries: {
    runMode: 0,
    openMode: 1,
  },

  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },

  e2e: {
    testAuditFolder: "cypress/reports/flaky-test-audit/",
    setupNodeEvents(on, config) {
      // Try different timeouts like 4000 and 12000
      config.defaultCommandTimeout = 12000;

      on = cypressOnFix(on);

      require("cypress-mochawesome-reporter/plugin")(on);

      addFlakyTestAuditTasks(on);

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    baseUrl: "https://sclavijosuero.github.io",
  },
});

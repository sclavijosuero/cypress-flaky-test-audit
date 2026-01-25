const { defineConfig } = require("cypress");

const addFlakyTestAuditTasks = require("./src/tasks.js");

const cypressOnFix = require("cypress-on-fix");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: false,

  retries: {
    runMode: 0,
    openMode: 1,
  },

  downloadsFolder: "cypress/downloads",

  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },

  e2e: {
    testAuditFolder: "cypress/reports/flaky-test-audit/",
    async setupNodeEvents(on, config) {
      config.defaultCommandTimeout = 4000;

      on = cypressOnFix(on);

      require("cypress-mochawesome-reporter/plugin")(on);

      addFlakyTestAuditTasks(on);

      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    baseUrl: "https://sclavijosuero.github.io",
  },
});

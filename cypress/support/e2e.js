// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

import '../../src/index.js'

// import '../../src/events'

import Utils from '../../src/utils'
import { specTests } from '../../src/events'

const getTestAuditResults = (test) => {
    const currentTestId = test.id
    const currentRetry = test.currentRetry

    const testSlownessThreshold = Cypress.env('testSlownessThreshold') ?? defaultTestSlownessThreshold
    const commandSlownessThreshold = Cypress.env('commandSlownessThreshold') ?? defaultCommandSlownessThreshold

    // Process commands that were executed
    // -----------------------------------
    const executedCommands = [...specTests.get(currentTestId).commandExecutions.values()].map((commandExecution) => {

        const command = commandExecution.command
        const attributes = command.attributes ? command.attributes : command

        const commandInfo = {
            commandEnqueuedTime: commandExecution.enqueuedTime,
            commandDuration: (commandExecution.endTime ?? commandExecution.retryTime) - commandExecution.startTime,
            commandRetries: commandExecution.retries,

            commandName: attributes.name,
            commandQuery: attributes.query,
            commandType: attributes.type,
            commandArgs: attributes.args,
            commandCurrentAssertionCommand: attributes.currentAssertionCommand,
            commandId: attributes.id,
            commandState: command.state,
        }

        return commandInfo
    })

    // Process commands that were enqueued but not executed
    // ----------------------------------------------------
    const unexecutedCommands = []
    specTests.get(currentTestId).commandsEnqueued.forEach(commandEnqueued => {
        const commandExecuted = specTests.get(currentTestId).commandExecutions.has(commandEnqueued.command.id)

        if (!commandExecuted) {
            const commandInfo = {
                commandEnqueuedTime: commandEnqueued.enqueuedTime,
                commandDuration: null,
                commandRetries: null,
                commandCurrentAssertionCommand: null,
                commandState: null,
                commandName: commandEnqueued.command.name,
                commandQuery: commandEnqueued.command.query,
                commandType: commandEnqueued.command.type,
                commandArgs: commandEnqueued.command.args,
                commandId: commandEnqueued.command.id,
            }

            unexecutedCommands.push(commandInfo)
        }
    })

    const commands = [ ...executedCommands, ...unexecutedCommands ]

    return {
        testData: { test, testSlownessThreshold },
        commandsData: { commands, commandSlownessThreshold },
    }

}

afterEach(() => {

  if (Cypress.env('enableFlakyTestAudit') !== true && Cypress.env('enableFlakyTestAudit') !== 'true') return

  const currentTest = cy.state().test   

  const testResult = getTestAuditResults(currentTest)
  if (!testResult) return

  const { testData, commandsData } = testResult

  if (Cypress.env('flakyTestAuditConsoleType') === 'list') {    

    // Display list of Audit Results in the browser console
    Utils.displayTestAuditAsListBrowserConsole(testData, commandsData)
    // Display list of Audit Results in the terminal console
    Utils.displayTestAuditAsListTerminalConsole(testData, commandsData)

  } else {
    // By default shows as table

    // Display table of Audit Results in the browser console
    Utils.displayTestAuditAsTableBrowserConsole(testData, commandsData)
    // Display table of Audit Results in the terminal console
    Utils.displayTestAuditAsTableTerminalConsole(testData, commandsData)
  }

})

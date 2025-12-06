import Utils from './utils'
import { specTests } from './events'

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

        // In the case that the URL visite fails, both endTime and retryTime will be null, so we need to calculate the duration based on current time
        const commandDuration = (commandExecution.endTime ?? commandExecution.retryTime ?? Date.now()) - commandExecution.startTime

        const commandInfo = {
            command: command,
            commandEnqueuedTime: commandExecution.enqueuedTime,
            commandDuration,
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
                command: commandEnqueued.command,
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

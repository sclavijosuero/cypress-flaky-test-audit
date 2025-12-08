/// <reference types="cypress" />

export const specAudit = new Map() // Map() structure with the audit of all tests in the spec file (including retries)
let currentTestId = null // Used by command events to identify the test
let currentCommandId = null // Used to handle retries (event 'command:retry')

if (Cypress.env('enableFlakyTestAudit') === true || Cypress.env('enableFlakyTestAudit') === 'true') {

    Cypress.on('test:before:run', (test) => {
        // console.log('................. test:before:run ')
        // console.log(test)

        currentTestId = test.id
        specAudit.set(currentTestId, { test, commandsExecution: new Map(), commandsEnqueued: new Map() })
    })

    Cypress.on('command:enqueued', (command) => {
        console.log('................. command:enqueued -> ' + command.name + ' ' + command.args + ' ' + command.id)
        console.log(command)

        const commandId = command.id
        const testAudit = specAudit.get(currentTestId)

        testAudit.commandsEnqueued.set(commandId, {
            commandId: commandId, // For convenence
            command: command,

            enqueuedTime: new Date() - 0,
            queueInsertionOrder: testAudit.commandsEnqueued.size,
        })
    });

    Cypress.on('command:start', (command) => {
        // Note: Assertion commands will not launch command:start event, they are evaluated with their query command (e.g. '.get().should()')
        console.log('................. command:start -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
        console.log(command)

        const commandId = command.attributes.id
        const testAudit = specAudit.get(currentTestId)

        testAudit.commandsExecution.set(commandId, {
            commandId: commandId, // For convenence
            command: command,

            startTime: new Date() - 0,
            endTime: null,
            retryTime: null,
            retries: 0,
            executionOrder: testAudit.commandsExecution.size,
        })

        currentCommandId = commandId // Used to handle retries (event 'command:retry')
    });

    Cypress.on('command:end', (command) => {
        // Note: Assertion commands will not launch command:end event, they are evaluated with their query command (e.g. '.get().should()')
        // console.log('................. command:end -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
        // console.log(command)

        const commandId = command.attributes.id
        const testAudit = specAudit.get(currentTestId)

        const commandExecution = testAudit.commandsExecution.get(commandId)
        commandExecution.endTime = new Date() - 0

        currentCommandId = null // Used to handle retries (event 'command:retry')
    });

    // A command fails when does not have endTimes[commandId], so the spent time to fail is actually retryTimes[currentCommandId]

    Cypress.on('command:retry', (options) => {
        // Note: Assertion commands will not launch command:retry event, they are evaluated with their query command (e.g. '.get().should()')
        // console.log('####### command:retry -> ' + currentCommandId)
        // console.log(options)

        const testAudit = specAudit.get(currentTestId)
        const commandExecution = testAudit.commandsExecution.get(currentCommandId)
        commandExecution.retryTime = new Date() - 0
        commandExecution.retries++
    });

}


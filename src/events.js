/// <reference types="cypress" />

export const specTests = new Map()
let currentTestId = null
let currentCommandId = null

if (Cypress.env('enableFlakyTestAudit') === true || Cypress.env('enableFlakyTestAudit') === 'true') {

    Cypress.on('test:before:run', (test) => {
        // console.log('................. test:before:run ')
        // console.log(test)

        currentTestId = test.id
        specTests.set(currentTestId, { test, commandExecutions: new Map(), commandsEnqueued: new Map() })
    })

    Cypress.on('command:enqueued', (command) => {
        console.log('................. command:enqueued -> ' + command.name + ' ' + command.args + ' ' + command.id)
        console.log(command)

        if (command.type !== 'assertion') {
            // Note: We skip assertions because they actually go with the query command they are asserting in the property 'attributes.currentAssertionCommand' (eg. '.get().should()')
            const commandId = command.id
            specTests.get(currentTestId).commandsEnqueued.set(commandId, {
                command: command,
                enqueuedTime: new Date() - 0,
                startTime: null,
                endTime: null,
                retryTime: null,
                retries: null,
            })
        }
       
    });

    Cypress.on('command:start', (command) => {
        console.log('................. command:start -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
        console.log(command)

        const commandId = command.attributes.id
        const commandEnqueued = specTests.get(currentTestId).commandsEnqueued.get(commandId)

        specTests.get(currentTestId).commandExecutions.set(commandId, {
            command: command,
            enqueuedTime: commandEnqueued.enqueuedTime,
            startTime: new Date() - 0,
            endTime: null,
            retryTime: null,
            retries: 0,
        })

        currentCommandId = commandId
    });

    Cypress.on('command:end', (command) => {
        console.log('................. command:end -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
        console.log(command)

        const commandId = command.attributes.id
        const commandExecution = specTests.get(currentTestId).commandExecutions.get(commandId)
        commandExecution.endTime = new Date() - 0

        currentCommandId = null
    });

    // A command fails when does not have endTimes[commandId], so the spent time to fail is actually retryTimes[currentCommandId]

    Cypress.on('command:retry', (options) => {
        // console.log('####### command:retry -> ' + currentCommandId)
        // console.log(options)

        const commandExecution = specTests.get(currentTestId).commandExecutions.get(currentCommandId)
        commandExecution.retryTime = new Date() - 0
        commandExecution.retries++
    });

}


/// <reference types="cypress" />

import Utils from './utils'

// Configuration
const defaultTestSlownessThreshold = 3000 // ms
const defaultCommandSlownessThreshold = 1000 // ms

const specTests = new Map()
let currentTestId = null
let currentCommandId = null


Cypress.on('test:before:run', (test) => {
    // console.log('................. test:before:run ')
    // console.log(test)

    currentTestId = test.id
    specTests.set(currentTestId, { test, commandExecutions: new Map(), commandsEnqueued: new Map() })
})

Cypress.on('command:enqueued', (command) => {
    // console.log('................. command:enqueued -> ' + command.name + ' ' + command.args + ' ' + command.id)
    // console.log(command)

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
    // console.log('................. command:start -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
    // console.log(command)

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
    // console.log('................. command:end -> ' + command.attributes.name + ' ' + command.attributes.args + ' ' + command.attributes.id)
    // console.log(command)

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

Cypress.on('test:after:run', (test) => {

    const currentTestId = test.id
    const testSlownessThreshold = Cypress.env('testSlownessThreshold') ?? defaultTestSlownessThreshold
    const commandSlownessThreshold = Cypress.env('commandSlownessThreshold') ?? defaultCommandSlownessThreshold

    // Display test info in console
    // -----------------------------
    Utils.displayTestConsole(test, testSlownessThreshold)

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

    // Display commands executed in theconsole
    executedCommands.forEach(commandInfo => {
        Utils.displayCommandConsole(commandInfo, commandSlownessThreshold)
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
  
    // Display unexecuted commands in the console
    unexecutedCommands.forEach(commandInfo => {
      Utils.displayCommandConsole(commandInfo, commandSlownessThreshold)
    })

})

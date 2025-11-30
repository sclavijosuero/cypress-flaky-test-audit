const trimString = (str, maxLength) => {
    return str.slice(0, Math.min(str.length, maxLength)) + (str.length > maxLength - 4 ? '...' + str.slice(-1) : '')
}

const statusIcon = (status, duration, threshold) => {
    if (status === 'passed') return duration > threshold ? '⏳' : '✔️'
    if (status === 'failed') return '❌'
    return '⛔'
}

const formatCommandArgs = (args) => {
    const maxFunctionLength = 35
    const maxObjectLength = 25
    const maxStringLength = 30

    const commandArgs = args.map(arg => {
        if (typeof arg === 'function') {
            // Callback function
            let str = arg.toString().replace(/[\r\n]+/g, '').replace(/\s+/g, '');
            return trimString(str, maxFunctionLength)
        } else if (typeof arg === 'string') {
            // String
            return '`' + trimString(arg, maxStringLength) + '`'
        } else if (typeof arg === 'object' && arg !== null && (arg.constructor === Object || Array.isArray(arg))) {
            // Object or Array
            const str = JSON.stringify(arg)
            return trimString(str, maxObjectLength)
        } else if (typeof arg === 'object' && arg !== null && arg.jquery) {
            // jQuery object
            return trimString(arg.get(0).outerHTML, maxObjectLength)
        } else {
            // Something else
            return arg
        }
    })
    return `(${commandArgs.join(', ')})`
}


// DISPLAY FUNCTIONS

const testDataAsString = (test, testSlownessThreshold) => {
    const testStatus = statusIcon(test.state, test.duration, testSlownessThreshold)
    let testDataStr = test.retries > 0 ? `
 ▪️ (#Current retry: ${test.currentRetry})` : ''

    if (test.invocationDetails) {
        // The retries do not have test.invocationDetails
        testDataStr = `
-----------------------------------------------------------------------------------------------------------
${testStatus} TEST TITLE: "${test.title}" | DURATION: ${test.duration} ms | STATUS: ${test.state.toUpperCase()} - (File: "${test.invocationDetails.relativeFile}")
-----------------------------------------------------------------------------------------------------------
${testDataStr}`
    }
    return testDataStr
}

const commandDataAsList = (commands, commandSlownessThreshold) => {
    const list = []

    commands.forEach(commandInfo => {
        const stateIcon = statusIcon(commandInfo.commandState, commandInfo.commandDuration, commandSlownessThreshold)
        const commandType = commandInfo.commandQuery ? `Query:   ` : `Command: `
        const commandName = `${commandInfo.commandName.toUpperCase()}`
        const commandArgs = `${formatCommandArgs(commandInfo.commandArgs)}`

        let assertionCommand = ''
        const commandCurrentAssertionCommand = commandInfo.commandCurrentAssertionCommand
        if (commandCurrentAssertionCommand) {
            assertionCommand = `.${commandCurrentAssertionCommand.attributes.name.toUpperCase()}${formatCommandArgs(commandCurrentAssertionCommand.attributes.args)}`
        }

        const commandEnqueuedTime = ` | Enqueued time: ${new Date(commandInfo.commandEnqueuedTime).toISOString()}`
        const runTime = commandInfo.commandDuration ? ` | Run time: ${commandInfo.commandDuration} ms` : ''
        const state = ` | State: ${(commandInfo.commandState || '**NEVER RUN**').toUpperCase()}`
        const retries = commandInfo.commandRetries ? ` | #Internal retries: ${commandInfo.commandRetries}` : ''

        list.push(`      ${stateIcon} ${commandType}${commandName}${commandArgs}${assertionCommand}${commandEnqueuedTime}${runTime}${state}${retries}`)
    })
    return list
}


const displayTestAuditAsListBrowserConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // ------------------------------------------------
    console.log(commandDataAsList(commands, commandSlownessThreshold).join('\n'))
    //commandDataAsList(commands, commandSlownessThreshold).forEach(line => console.log(line));
}


const commandDataAsTable = (commands, commandSlownessThreshold) => {
    const tableRows = commands.map(commandInfo => {
        let assertionCommand = '';
        const commandCurrentAssertionCommand = commandInfo.commandCurrentAssertionCommand;
        if (commandCurrentAssertionCommand) {
            assertionCommand = `.${commandCurrentAssertionCommand.attributes.name.toUpperCase()}${formatCommandArgs(commandCurrentAssertionCommand.attributes.args)}`;
        }

        const stateIcon = statusIcon(commandInfo.commandState, commandInfo.commandDuration, commandSlownessThreshold)
        const state = (commandInfo.commandState || '**NEVER RUN**').toUpperCase()

        return {
            "Type": `${stateIcon} ${commandInfo.commandQuery ? 'Query' : 'Command'}`,
            // "Name": commandInfo.commandName.toUpperCase(),
            // "Args": formatCommandArgs(commandInfo.commandArgs),
            // "Assertion Commands": assertionCommand,
            "Command": commandInfo.commandName.toUpperCase() +
                       formatCommandArgs(commandInfo.commandArgs) +
                       assertionCommand,
            "Enqueued Time": new Date(commandInfo.commandEnqueuedTime).toISOString(),
            "Run Time": commandInfo.commandDuration ? `${commandInfo.commandDuration} ms` : ``,
            "State": (commandInfo.commandState || '**NEVER RUN**').toUpperCase(),
            "#Internal retries": commandInfo.commandRetries ? commandInfo.commandRetries : ``,
        }
    });
    return tableRows
}

const displayTestAuditAsTableBrowserConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // ------------------------------------------------
    console.table(commandDataAsTable(commands, commandSlownessThreshold));
}

export default {
    displayTestAuditAsListBrowserConsole,
    displayTestAuditAsTableBrowserConsole,
}
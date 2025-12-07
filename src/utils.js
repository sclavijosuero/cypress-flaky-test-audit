const trimString = (str, maxLength) => {
    return str.slice(0, Math.min(str.length, maxLength)) + (str.length > maxLength - 4 ? '...' + str.slice(-1) : '')
}

const statusIcon = (status, duration, threshold) => {
    if (status === 'passed') return duration > threshold ? '⏳' : '✔️'
    if (status === 'failed') return '❌'
    return '⛔'
}

const formatCommandArgs = (args) => {
    const maxFunctionLength = 40
    const maxObjectLength = 25
    const maxStringLength = 25

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


const testDataAsString = (test, testSlownessThreshold) => {

    const testStatus = statusIcon(test.state, test.duration, testSlownessThreshold)
    const currentRetry = test._retries > 0 ? ` | (#Current retry: ${test._currentRetry})` : ''

    let relativeFile
    if (test._currentRetry === 0) {
        relativeFile = test.invocationDetails.relativeFile
    } else {
        // The retries do not have test.invocationDetails (but the parent)
        relativeFile = test.parent.invocationDetails.relativeFile
    }

    const testDataStr = `
------------------------------------------------------------------------------------------------------------------------------
${testStatus} TEST TITLE: "${test.title}"${currentRetry} | DURATION: ${test.duration} ms | STATUS: ${test.state.toUpperCase()} - (File: "${relativeFile}")
------------------------------------------------------------------------------------------------------------------------------`

    return testDataStr
}


// const assertionCommandAsString = (commandInfo) => {
//     console.log('-------assertionCommandAsString')
//     console.log(commandInfo)

//     let assertionCommand = '';
//     const commandCurrentAssertionCommand = commandInfo.commandCurrentAssertionCommand;
//     if (commandCurrentAssertionCommand) {
//         assertionCommand = ` .${commandCurrentAssertionCommand.attributes.name.toUpperCase()}${formatCommandArgs(commandCurrentAssertionCommand.attributes.args)}`;
//     }
//     return assertionCommand;
// }

const getAssertionsRecursive = (commandAttributes, originalCommandId) => {
    // console.log('-------getAssertionsRecursive')
    // console.log(commandAttributes)
    // console.log(originalCommandId)

    // if (commandAttributes)
    //   console.log('-------getAssertionsRecursive (', commandAttributes.name, ')', commandAttributes.args)

    if (!commandAttributes || !commandAttributes.id || commandAttributes.id === originalCommandId) return '';


    const assertionCommand = getAssertionsRecursive(commandAttributes.prev.attributes, originalCommandId) +
           ` .${commandAttributes.name.toUpperCase()}${formatCommandArgs(commandAttributes.args)}`;
        // console.log('-------BACK assertionCommand')
        // console.log(assertionCommand)
    return assertionCommand;
}

const assertionCommandAsString = (commandInfo) => {
    // console.log('--------------assertionCommandAsString')
    // console.log(commandInfo)

    let assertionCommand = '';
    
    const commandCurrentAssertionCommand = commandInfo.commandCurrentAssertionCommand
    if (commandCurrentAssertionCommand) {
        assertionCommand = getAssertionsRecursive(commandCurrentAssertionCommand.attributes, commandInfo.commandId);
        // assertionCommand = ` .${commandCurrentAssertionCommand.attributes.name.toUpperCase()}${formatCommandArgs(commandCurrentAssertionCommand.attributes.args)}`;
    }
    return assertionCommand;
}

const commandDataAsList = (commands, commandSlownessThreshold) => {
    const list = []

    commands.forEach(commandInfo => {
        const stateIcon = statusIcon(commandInfo.commandState, commandInfo.commandDuration, commandSlownessThreshold)
        const commandType = commandInfo.commandQuery ? `Query:   ` : `Command: `
        const commandName = `${commandInfo.commandName.toUpperCase()}`
        const commandArgs = `${formatCommandArgs(commandInfo.commandArgs)}`

        const assertionCommand = assertionCommandAsString(commandInfo);

        const commandEnqueuedTime = ` | Enqueued time: ${new Date(commandInfo.commandEnqueuedTime).toISOString()}`
        const runTime = commandInfo.commandDuration ? ` | Run time: ${commandInfo.commandDuration} ms` : ''
        const state = ` | State: ${(commandInfo.commandState || '**NEVER RUN**').toUpperCase()}`
        const retries = commandInfo.commandRetries ? ` | #Internal retries: ${commandInfo.commandRetries}` : ''

        list.push(`      ${stateIcon}  ${commandType}${commandName}${commandArgs}${assertionCommand}${commandEnqueuedTime}${runTime}${state}${retries}`)
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
}

const displayTestAuditAsListTerminalConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(test, testSlownessThreshold), { log: false })

    // Display commands executed in the terminal console
    // -------------------------------------------------
    cy.task('displayListInTerminal', commandDataAsList(commands, commandSlownessThreshold), { log: false })
}

const commandDataAsTable = (commands, commandSlownessThreshold) => {
    const tableRows = commands.map(commandInfo => {
        const assertionCommand = assertionCommandAsString(commandInfo);

        const stateIcon = statusIcon(commandInfo.commandState, commandInfo.commandDuration, commandSlownessThreshold)
        const state = (commandInfo.commandState || '**NEVER RUN**').toUpperCase()

        return {
            "Type": `${stateIcon}  ${commandInfo.commandQuery ? 'Query' : 'Command'}`,
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

const displayTestAuditAsTableTerminalConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(test, testSlownessThreshold), { log: false })

    // Display commands executed in the browser console
    // ------------------------------------------------
    cy.task('displayTableInTerminal', commandDataAsTable(commands, commandSlownessThreshold), { log: false });
}


export default {
    displayTestAuditAsListBrowserConsole,
    displayTestAuditAsListTerminalConsole,
    displayTestAuditAsTableBrowserConsole,
    displayTestAuditAsTableTerminalConsole,
}



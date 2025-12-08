// **********************************************************************************
// CONSTANTS
// **********************************************************************************

const argsMaxLengths = {
    browserConsole: 60,
    terminalConsole: 40,
}

// **********************************************************************************
// PRIVATE FUNCTIONS
// **********************************************************************************

const trimString = (str, maxLength) => {
    return str.slice(0, Math.min(str.length, maxLength)) + (str.length > maxLength - 4 ? '...' + str.slice(-1) : '')
}


const getStateIcon = (status, slow) => {
    if (status === 'passed') return slow ? '✔️⏳' : '✔️'
    if (status === 'failed') return '❌'
    return '⛔'
}

const getStateDescription = (state, slow) => {
    const stateValue = state.toUpperCase()
    return state === 'queued' ? stateValue + ' (*never run*)' : state === 'passed' && slow ? stateValue + ' (*slow*)' : stateValue
}

const formatCommandArgs = (args, consoleType) => {
    // Max lengths for the different console types

    const maxFunctionLength = argsMaxLengths[consoleType]
    const maxObjectLength = argsMaxLengths[consoleType]
    const maxStringLength = argsMaxLengths[consoleType]

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
    const slow = test.duration > testSlownessThreshold

    const testStatus = getStateIcon(test.state, slow)
    const testDescription = getStateDescription(test.state, slow)

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
${testStatus} ${testDescription} | TEST TITLE: "${test.title}"${currentRetry} | DURATION: ${test.duration} ms | STATUS: ${test.state.toUpperCase()} - (File: "${relativeFile}")
------------------------------------------------------------------------------------------------------------------------------`

    return testDataStr
}


// const getAssertionsRecursive = (commandAttributes, originalCommandId) => {
//     // console.log('-------getAssertionsRecursive')
//     // console.log(commandAttributes)
//     // console.log(originalCommandId)

//     // if (commandAttributes)
//     //   console.log('-------getAssertionsRecursive (', commandAttributes.name, ')', commandAttributes.args)

//     if (!commandAttributes || !commandAttributes.id || commandAttributes.id === originalCommandId) return '';


//     const assertionCommand = getAssertionsRecursive(commandAttributes.prev.attributes, originalCommandId) +
//         ` .${commandAttributes.name.toUpperCase()}${formatCommandArgs(commandAttributes.args)}`;
//     // console.log('-------BACK assertionCommand')
//     // console.log(assertionCommand)
//     return assertionCommand;
// }

const getCommandType = (commandInfo) => {
    return commandInfo.query ? 'Query'
        : commandInfo.type === 'assertion' ? 'Assertion'
        : `Command (${commandInfo.type})`;
}

const getCommandName = (commandInfo, consoleType) => {
    return `${commandInfo.name.toUpperCase()} ${formatCommandArgs(commandInfo.args, consoleType)}`
}


const getCommandState = (commandInfo, commandSlownessThreshold) => {
    const slow = commandInfo.duration > commandSlownessThreshold

    const stateIconValue = getStateIcon(commandInfo.state, slow)
    const stateDescription = getStateDescription(commandInfo.state, slow)

    return `${stateIconValue} ${stateDescription}`


    // return commandInfo.state === 'queued' ? commandInfo.state.toUpperCase() + ' (**never run**)' : commandInfo.state.toUpperCase()
    // return commandInfo.state.toUpperCase()
    // return stateIconValue
}

const commandDataAsList = (commands, commandSlownessThreshold, consoleType) => {
    const list = []

    commands.forEach(commandInfo => {
        const state = `${getCommandState(commandInfo, commandSlownessThreshold)}`
        const commandType = ` | ${getCommandType(commandInfo)}`;
        const name = ` | ${getCommandName(commandInfo, consoleType)}`;

        const commandEnqueuedTime = ` | Enqueued time: ${new Date(commandInfo.enqueuedTime).toISOString()}`
        const runTime = commandInfo.duration ? ` | Run time: ${commandInfo.duration} ms` : ''
        const retries = ` | #Internal retries: ${commandInfo.retries ?? ""}`

        list.push(`      ${state}${commandType}${name}${commandEnqueuedTime}${runTime}${retries}`)
    })
    return list
}

const commandDataAsTable = (commands, commandSlownessThreshold, consoleType) => {
    console.log(commands)

    const tableRows = commands.map(commandInfo => {
        // const assertionCommand = assertionCommandAsString(commandInfo);

        const commandType = getCommandType(commandInfo);

        const name = getCommandName(commandInfo, consoleType);

        return {
            "State": `${getCommandState(commandInfo, commandSlownessThreshold)}`,
            "Type": `${commandType}`,
            "Command": name,
            "Enqueued Time": new Date(commandInfo.enqueuedTime).toISOString(),
            "Run Time": commandInfo.duration ? `${commandInfo.duration} ms` : ``,
            "#Internal retries": commandInfo.retries ?? "",
        }
    });
    return tableRows
}


// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsListBrowserConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // -------------------------------------------default.statusIcon-----
    console.log(commandDataAsList(commands, commandSlownessThreshold, 'browserConsole').join('\n'))
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsListTerminalConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(test, testSlownessThreshold), { log: false })

    // Display commands executed in the terminal console
    // -------------------------------------------------
    cy.task('displayListInTerminal', commandDataAsList(commands, commandSlownessThreshold, 'terminalConsole'), { log: false })
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableBrowserConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // ------------------------------------------------
    console.table(commandDataAsTable(commands, commandSlownessThreshold, 'browserConsole'));
}

// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableTerminalConsole = (testData, commandsData) => {
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(test, testSlownessThreshold), { log: false })

    // Display commands executed in the browser console
    // ------------------------------------------------
    cy.task('displayTableInTerminal', commandDataAsTable(commands, commandSlownessThreshold, 'terminalConsole'), { log: false });
}


export default {
    displayTestAuditAsListBrowserConsole,
    displayTestAuditAsListTerminalConsole,
    displayTestAuditAsTableBrowserConsole,
    displayTestAuditAsTableTerminalConsole,
}



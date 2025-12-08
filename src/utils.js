// **********************************************************************************
// PRIVATE FUNCTIONS
// **********************************************************************************

const trimString = (str, maxLength) => {
    return str.slice(0, Math.min(str.length, maxLength)) + (str.length > maxLength - 4 ? '...' + str.slice(-1) : '')
}

const stateIcon = (status, duration, threshold) => {
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

    const testStatus = stateIcon(test.state, test.duration, testSlownessThreshold)
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

const getCommandType = (commandInfo) => {
    return commandInfo.query ? 'Query'
        : commandInfo.type === 'assertion' ? 'Assertion'
        : `Command (${commandInfo.type})`;
}

const getCommandName = (commandInfo) => {
    return `${commandInfo.name.toUpperCase()} ${formatCommandArgs(commandInfo.args)}`
}

const getCommandState = (commandInfo) => {
    return commandInfo.state === 'queued' ? commandInfo.state + ' (** never run **)' : commandInfo.state
}

const commandDataAsList = (commands, commandSlownessThreshold) => {
    const list = []

    commands.forEach(commandInfo => {
        const stateIconValue = stateIcon(commandInfo.state, commandInfo.duration, commandSlownessThreshold)
        const commandType = getCommandType(commandInfo);
        const name = ` | ${getCommandName(commandInfo)}`;

        const commandEnqueuedTime = ` | Enqueued time: ${new Date(commandInfo.enqueuedTime).toISOString()}`
        const runTime = commandInfo.duration ? ` | Run time: ${commandInfo.duration} ms` : ''
        const state = ` | State: ${commandInfo.state !== 'queued' ? commandInfo.state : commandInfo.state + '(**NEVER RUN**)'}`.toUpperCase()
        const retries = commandInfo.retries ? ` | #Internal retries: ${commandInfo.retries}` : ''

        list.push(`      ${stateIconValue}  ${commandType}${name}${commandEnqueuedTime}${runTime}${state}${retries}`)
    })
    return list
}

const commandDataAsTable = (commands, commandSlownessThreshold) => {
    console.log(commands)

    const tableRows = commands.map(commandInfo => {
        // const assertionCommand = assertionCommandAsString(commandInfo);

        const stateIconValue = stateIcon(commandInfo.state, commandInfo.duration, commandSlownessThreshold)
        const commandType = getCommandType(commandInfo);

        const name = getCommandName(commandInfo);

        return {
            "Type": `${stateIconValue}  ${commandType}`,
            "Command": name,
            "Enqueued Time": new Date(commandInfo.enqueuedTime).toISOString(),
            "Run Time": commandInfo.duration ? `${commandInfo.duration} ms` : ``,
            "State": (commandInfo.state !== 'queued' ? commandInfo.state : commandInfo.state + '(**NEVER RUN**)').toUpperCase(),
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
    console.log('&&&& HERE displayTestAuditAsListBrowserConsole')
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // -------------------------------------------default.statusIcon-----
    console.log(commandDataAsList(commands, commandSlownessThreshold).join('\n'))
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsListTerminalConsole = (testData, commandsData) => {
    console.log('&&&& HERE displayTestAuditAsListTerminalConsole')
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(test, testSlownessThreshold), { log: false })

    // Display commands executed in the terminal console
    // -------------------------------------------------
    cy.task('displayListInTerminal', commandDataAsList(commands, commandSlownessThreshold), { log: false })
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableBrowserConsole = (testData, commandsData) => {
    console.log('&&&& HERE displayTestAuditAsTableBrowserConsole')
    const { test, testSlownessThreshold } = testData
    const { commands, commandSlownessThreshold } = commandsData

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(test, testSlownessThreshold))

    // Display commands executed in the browser console
    // ------------------------------------------------
    console.table(commandDataAsTable(commands, commandSlownessThreshold));
}

// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableTerminalConsole = (testData, commandsData) => {
    console.log('&&&& HERE displayTestAuditAsTableTerminalConsole')
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



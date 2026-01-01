// **********************************************************************************
// CONSTANTS
// **********************************************************************************

const argsMaxLengths = {
    browserConsole: 60,
    terminalConsole: 40,
}

const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3, // Displays milliseconds with 3 digits (000-999)
    hour12: false,
};


// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsListBrowserConsole = (testData, commandsData) => {
    commandsData.consoleType = 'browserConsole'

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(testData))

    // Display commands executed in the browser console
    // -------------------------------------------default.statusIcon-----
    console.log(commandDataAsList(commandsData).join('\n'))
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsListTerminalConsole = (testData, commandsData) => {
    commandsData.consoleType = 'terminalConsole'

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(testData), { log: false })

    // Display commands executed in the terminal console
    // -------------------------------------------------
    cy.task('displayListInTerminal', commandDataAsList(commandsData), { log: false })
}


// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableBrowserConsole = (testData, commandsData) => {
    commandsData.consoleType = 'browserConsole'

    // Display test info in browser console
    // ------------------------------------
    console.log(testDataAsString(testData))

    // Display commands executed in the browser console
    // ------------------------------------------------
    console.table(commandDataAsTable(commandsData));
}

// PUBLIC FUNCTION
// ----------------
const displayTestAuditAsTableTerminalConsole = (testData, commandsData) => {
    commandsData.consoleType = 'terminalConsole'

    // Display test info in terminal console
    // -------------------------------------
    cy.task('displayTestDataInTerminal', testDataAsString(testData), { log: false })

    // Display commands executed in the browser console
    // ------------------------------------------------
    cy.task('displayTableInTerminal', commandDataAsTable(commandsData), { log: false });
}


// **********************************************************************************
// PRIVATE FUNCTIONS
// **********************************************************************************

const trimString = (str, maxLength) => {
    return str.slice(0, Math.min(str.length, maxLength)) + (str.length > maxLength - 4 ? '...' + str.slice(-1) : '')
}

const getStateIcon = (status, slow) => {
    if (status === 'passed') return '✔️'
    if (status === 'failed') return '❌'
    return '⛔'
}

const getStateDescription = (state, slow) => {
    const stateValue = state.toUpperCase()
    return state === 'queued' ? stateValue + ' (*never run*)' : state === 'passed' && slow ? stateValue + ' (⏳ *slow*)' : stateValue
}


const testDataAsString = ({ test, testSlownessThreshold, testStartTime }) => {
    const slow = test.duration > testSlownessThreshold

    const testStatus = getStateIcon(test.state, slow)
    const testDescription = getStateDescription(test.state, slow)

    const currentRetry = test._retries > 0 ? ` | (#Test retry: ${test._currentRetry})` : ''

    const relativeFile = Cypress.spec.relative

    const testDataStr = `
------------------------------------------------------------------------------------------------------------------------------
${testStatus} ${testDescription} | TEST TITLE: "${test.title}"${currentRetry} | START TIME: ${new Date(testStartTime).toLocaleTimeString(undefined, timeOptions)} | DURATION: ${test.duration} ms - (File: "${relativeFile}")
------------------------------------------------------------------------------------------------------------------------------`

    return testDataStr
}


const getCommandType = (commandInfo) => {
    return commandInfo.query ? 'Query'
        : commandInfo.type === 'assertion' ? (Cypress.env('flakyTestAuditConsoleType') === 'list' ? 'Assertion' : ' └─ Assertion')
        : `Command (${commandInfo.type})`;
}

const getCommandName = (commandInfo, consoleType) => {
    return `${commandInfo.name.toUpperCase()} ${formatCommandArgs(commandInfo.args, consoleType)}`
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

const getCommandState = (commandInfo, commandSlownessThreshold) => {
    const slow = commandInfo.duration > commandSlownessThreshold

    const stateIconValue = getStateIcon(commandInfo.state, slow)
    const stateDescription = getStateDescription(commandInfo.state, slow)

    return `${stateIconValue} ${stateDescription}`
}

const commandDataAsList = ({ commands, commandSlownessThreshold, consoleType }) => {
    const list = []

    commands.forEach(commandInfo => {
        const state = `${getCommandState(commandInfo, commandSlownessThreshold)}`
        const runnableType = commandInfo.runnableType ? ` | ${commandInfo.runnableType}` : ''
        const commandType = ` | ${getCommandType(commandInfo)}`;
        const name = ` | ${getCommandName(commandInfo, consoleType)}`;

        const enqueuedOrder = ` | Enqueued order: ${commandInfo.queueInsertionOrder}`
        const commandEnqueuedTime = ` | Enqueued time: ${new Date(commandInfo.enqueuedTime).toLocaleTimeString(undefined, timeOptions)}`
        // const commandEnqueuedTimePerformance = ` | Enqueued time performance: ${commandInfo.enqueuedTimePerformance.toFixed(3)} ms`

        const executionOrder = ` | Execution order: ${commandInfo.executionOrder ?? '-'}`
        const commandStartTime = ` | Start time: ${commandInfo.startTime !== undefined && commandInfo.startTime !== null ? new Date(commandInfo.startTime).toLocaleTimeString(undefined, timeOptions) : '-'}`
        // const commandStartTimePerformance = commandInfo.startTimePerformance ? ` | Start time performance: ${commandInfo.startTimePerformance.toFixed(3)} ms` : '

        const commandRunTime = ` | Run  (ms): ${commandInfo.duration ?? '-'}${commandInfo.duration === 0 || commandInfo.duration ? ' ms' : ''}`
        // const commandRunTimePerformance = commandInfo.durationPerformance ? ` | Run time performance: ${commandInfo.durationPerformance.toFixed(3)} ms` : ''

        // const commandEndTime = commandInfo.endTime ? ` | End time: ${new Date(commandInfo.endTime).toLocaleTimeString(undefined, timeOptions)}` : ''
        // const commandEndTimePerformance = commandInfo.endTimePerformance ? ` | End time performance: ${commandInfo.endTimePerformance.toFixed(3)} ms` : ''

        const commandRetries = ` | #Internal retries: ${commandInfo.retries ?? '-'}`

        list.push(`   ${state}${runnableType}${commandType}${name}${enqueuedOrder}${commandEnqueuedTime}${executionOrder}${commandStartTime}${commandRunTime}${commandRetries}`)
    })
    return list
}

const commandDataAsTable = ({ commands, commandSlownessThreshold, consoleType }) => {
    const tableRows = commands.map(commandInfo => {
        // const assertionCommand = assertionCommandAsString(commandInfo);

        const commandType = getCommandType(commandInfo);
        const runnableType = commandInfo.runnableType ?? ''
        const name = getCommandName(commandInfo, consoleType);

        return {
            "State": `${getCommandState(commandInfo, commandSlownessThreshold)}`,
            "Runnable type": runnableType,
            "Type": `${commandType}`,
            "Command": name,

            "Enqueued order": commandInfo.queueInsertionOrder,
            "Enqueued time": new Date(commandInfo.enqueuedTime).toLocaleTimeString(undefined, timeOptions),
            // "Enqueued time performance": `${commandInfo.enqueuedTimePerformance.toFixed(3)} ms`,

            "Execution order": commandInfo.executionOrder ?? '',
            "Start time": commandInfo.startTime ? `${new Date(commandInfo.startTime).toLocaleTimeString(undefined, timeOptions)}` : ``,
            // "Start time performance": commandInfo.startTimePerformance ? `${commandInfo.startTimePerformance.toFixed(3)} ms` : ``,

            // "End time": commandInfo.endTime ? new Date(commandInfo.endTime).toLocaleTimeString(undefined, timeOptions) : ``,
            // "End time performance": commandInfo.endTimePerformance ? `${commandInfo.endTimePerformance.toFixed(3)} ms` : ``,

            // "Run time (ms)": commandInfo.duration ? `${commandInfo.duration.toFixed(3)}` : ``,
            "Run time (ms)": commandInfo.duration ?? ``,
            // "Run time performance": commandInfo.durationPerformance ? `${commandInfo.durationPerformance.toFixed(3)} ms` : ``,

            "#Internal retries": commandInfo.retries ?? "",
        }
    });
    return tableRows
}


export default {
    displayTestAuditAsListBrowserConsole,
    displayTestAuditAsListTerminalConsole,
    displayTestAuditAsTableBrowserConsole,
    displayTestAuditAsTableTerminalConsole,
    getCommandName,
    formatCommandArgs
}




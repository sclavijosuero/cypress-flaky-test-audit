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

const displayTestConsole = (test, testSlownessThreshold) => {
    const testStatus = statusIcon(test.state, test.duration, testSlownessThreshold)
    const currentRetry = test.retries > 0 ? ` (#Current retry: ${test.currentRetry})` : ''
    if (test.invocationDetails) {
      // The retries do not have test.invocationDetails
      console.log(`-----------------------------------------------------------------------------------------------------------`)
      console.log(`TEST FILE: "${test.invocationDetails.relativeFile}"`)
    }
    console.log(`   ${testStatus} TEST TITLE: "${test.title}"${currentRetry} | DURATION: ${test.duration} ms | STATUS: ${test.state.toUpperCase()} `)
}

const displayCommandConsole = (commandInfo, commandSlownessThreshold) => {
    const commandType = commandInfo.commandQuery ? `Query:   ` : `Command: `
    const commandName = `${commandInfo.commandName.toUpperCase()}`
    const commandArgs = `${formatCommandArgs(commandInfo.commandArgs)}`

    let assertionCommand = ''
    const commandCurrentAssertionCommand = commandInfo.commandCurrentAssertionCommand
    if (commandCurrentAssertionCommand) {
        assertionCommand = `.${commandCurrentAssertionCommand.attributes.name.toUpperCase()}${formatCommandArgs(commandCurrentAssertionCommand.attributes.args)}`
    }

    const commandEnqueuedTime = ` | Enqueued on: ${new Date(commandInfo.commandEnqueuedTime).toISOString()}`
    const runTime = commandInfo.commandDuration ? ` | Run time: ${commandInfo.commandDuration} ms` : ''
    const state = ` | State: ${(commandInfo.commandState || '**NEVER RUN**').toUpperCase()}`
    const retries = commandInfo.commandRetries ? ` | #Internal retries: ${commandInfo.commandRetries}` : ''
    const status = statusIcon(commandInfo.commandState, commandInfo.commandDuration, commandSlownessThreshold)

    console.log(`      ${status} ${commandType}${commandName}${commandArgs}${assertionCommand}${commandEnqueuedTime}${runTime}${state}${retries}`)
}

export default {
    formatCommandArgs,
    displayTestConsole,
    displayCommandConsole,
    statusIcon,
    trimString,
}
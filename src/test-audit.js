import Utils from './utils'
import { specAudit } from './events'

// **********************************************************************************
// ONLY RUN THE TEST AUDIT IF CONFIGURED AS SUCH
// (test-audir.js TO BE IMPORTED IN e2e.js FILE BEFORE ANYTHING ELSE)
// **********************************************************************************

if (Cypress.env('enableFlakyTestAudit') === true || Cypress.env('enableFlakyTestAudit') === 'true') {


    // ----------------------------------------------------------------------------------
    // CONSTANTS
    // ----------------------------------------------------------------------------------

    const testSlownessThreshold = Cypress.env('testSlownessThreshold') ?? 5000   // Default 5 seconds
    const commandSlownessThreshold = Cypress.env('commandSlownessThreshold') ?? 1500 // Default 1.5 seconds

    // ----------------------------------------------------------------------------------
    // FUNCTIONS
    // ----------------------------------------------------------------------------------

    const findNextCommandEnqueuedData = (currentTestId, currentCommandId) => {
        const testAudit = specAudit.get(currentTestId)  // Is the Map
        let found = false;

        // testAudit is an object with a property 'commandsEnqueued' that is a Map
        const commandsEnqueued = testAudit.commandsEnqueued;
        for (const [k, v] of commandsEnqueued) {
            if (found) {
                return k // This is the command Id for the next entry in the queue after currentCommandId
            }
            if (k === currentCommandId) {
                found = true;
            }
        }

        return null; // No next entry
    }


    const processCommand = ({ currentTestId, commandEnqueuedData, prevCommandId, idAssertionCommandFailed }, resultsGraph = new Map()) => {
        // Return early if command enqueued data is missing or the command is missing
        if (!commandEnqueuedData || !commandEnqueuedData.command) return resultsGraph

        const runInfo = commandEnqueuedData.runInfo
        const $command = commandEnqueuedData.command
        const id = runInfo.commandId

        const attributes = $command.attributes ? $command.attributes : $command
        let state = $command.state
        if (attributes.type === 'assertion' && idAssertionCommandFailed === id) {
            state = 'failed'
        }

        // Skip if the command is a 'task' and its first argument is in testAuditResultTasks (is a task displaying results of the audit)
        if (attributes.name === 'task' &&
            Array.isArray(attributes.args) &&
            attributes.args.length > 0 &&
            Utils.testAuditResultTasks?.includes(attributes.args[0])
        ) return resultsGraph;

        // Update previous command with this as its next commnad
        if (prevCommandId && resultsGraph.get(prevCommandId)) {
            resultsGraph.get(prevCommandId).nextCommandId = id
        }

        // Calculate command end time and duration
        const startTime = runInfo.startTime
        const startTimePerformance = runInfo.startTimePerformance

        let endTime, endTimePerformance, duration, durationPerformance;
        if (startTime) {
            endTime = runInfo.endTime ?? runInfo.retryTime ?? Date.now()
            endTimePerformance = runInfo.endTimePerformance ?? runInfo.retryTimePerformance ?? performance.now()

            duration = endTime - runInfo.startTime
            durationPerformance = endTimePerformance - startTimePerformance
        }

        const $nextCommand = attributes.next;

        let nextCommandId
        if ($nextCommand && $nextCommand.attributes && $nextCommand.attributes.id) {
            nextCommandId = $nextCommand.attributes.id;
        }

        // This is the commandInfo of the next command execurted after currentCommandId (according to the efective run order)
        const commandEnqueuedDataNext = specAudit.get(currentTestId).commandsEnqueued.get(nextCommandId);

        if (commandEnqueuedDataNext) {
            // Override command to get all the info including attributes and state after command was run
            commandEnqueuedDataNext.command = $nextCommand;
        }

        // This is the command Id for the next entry in the queue after currentCommandId (according to the enqued order)
        const nextQueuedCommandId = findNextCommandEnqueuedData(currentTestId, id);

        let idAssertionCommandThatWillFail
        if (attributes.query && state === 'failed') {
            idAssertionCommandThatWillFail = attributes.currentAssertionCommand?.attributes?.id
            if (idAssertionCommandThatWillFail) {
                state = 'passed'
            }
        }

        // Clean graph node data for the command (only info needed for the graph)
        // Mashup command attributes into a single object
        const commandInfo = {
            id,
            name: attributes.name,
            args: attributes.args,
            type: attributes.type,
            query: attributes.query,
            runnableType: runInfo.runnableType,
            state,

            currentAssertionCommand: attributes.currentAssertionCommand,

            enqueuedTime: runInfo.enqueuedTime,
            enqueuedTimePerformance: runInfo.enqueuedTimePerformance,
            startTime,
            startTimePerformance,
            endTime,
            endTimePerformance,
            duration,
            durationPerformance,
            retries: runInfo.retries,
            queueInsertionOrder: runInfo.queueInsertionOrder,
            executionOrder: runInfo.executionOrder,
            nextCommandId,
            prevCommandId,

            nextQueuedCommandId,
        }

        resultsGraph.set(id, commandInfo)

        return processCommand({ currentTestId, commandEnqueuedData: commandEnqueuedDataNext, prevCommandId: id, idAssertionCommandFailed: idAssertionCommandThatWillFail }, resultsGraph)
    }

    const getTestAuditResults = (test) => {

        if (!test) return null

        const currentTestId = test.id

        const testAudit = specAudit.get(currentTestId)
        const testStartTime = testAudit.testStartTime
        const commandsEnqueuedIterator = testAudit.commandsEnqueued.values()

        // Get the first command enqueued data
        const commandEnqueuedData = commandsEnqueuedIterator.next().value;
        // console.log('#################################### testAudit')
        // console.log(testAudit)
        // console.log('####################################')

        // TODO: Maybe replace the resultsGraph with a Map (ensude graph nodes added in order according to next field)
        const resultsGraph = processCommand({ currentTestId, commandEnqueuedData, prevCommandId: null }, new Map())

        return { resultsGraph, testStartTime }

    }

    // ----------------------------------------------------------------------------------
    // MAIN AFTER EACH FUNCTION FOR TEST AUTIT
    // ----------------------------------------------------------------------------------
    beforeEach(() => {

    })

    // ----------------------------------------------------------------------------------
    // MAIN AFTER EACH FUNCTION FOR TEST AUTIT
    // ----------------------------------------------------------------------------------
    afterEach(() => {

        // Only run the test audit is configured as such


        const test = cy.state().test

        const {resultsGraph, testStartTime} = getTestAuditResults(test)

        // console.log('#################################### resultsGraph')
        // console.log(resultsGraph)
        // console.log('####################################')

        if (!resultsGraph) return

        const commands = Array.from(resultsGraph.values());
        const testData = { test, testSlownessThreshold, testStartTime }
        const commandsData = { commands, commandSlownessThreshold }


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
}

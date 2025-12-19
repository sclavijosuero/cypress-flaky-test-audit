import Utils from './utils'
import { specAudit } from './events'
import Report from './report'

const testAuditResults = new Map()

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

    const findNextCommandEnqueuedData = (currentTestIdAndRetry, currentCommandId) => {
        const testAudit = specAudit.get(currentTestIdAndRetry)  // Is the Map
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


    const processCommand = ({ currentTestIdAndRetry, commandEnqueuedData, prevCommandId, idAssertionCommandFailed }, resultsGraph = new Map()) => {
        // Return early if command enqueued data is missing or the command is missing
        if (!commandEnqueuedData || !commandEnqueuedData.command) return resultsGraph

        // console.log('---------------------------')
        // console.log(commandEnqueuedData)
        // console.log('---------------------------')

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
        const commandEnqueuedDataNext = specAudit.get(currentTestIdAndRetry).commandsEnqueued.get(nextCommandId);

        if (commandEnqueuedDataNext) {
            // Override command to get all the info including attributes and state after command was run
            commandEnqueuedDataNext.command = $nextCommand;
        }

        // This is the command Id for the next entry in the queue after currentCommandId (according to the enqued order)
        const nextQueuedCommandId = findNextCommandEnqueuedData(currentTestIdAndRetry, id);

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
            prevQueuedCommandId: undefined,
            nestedLevel: undefined,
        }

        resultsGraph.set(id, commandInfo)

        return processCommand({ currentTestIdAndRetry, commandEnqueuedData: commandEnqueuedDataNext, prevCommandId: id, idAssertionCommandFailed: idAssertionCommandThatWillFail }, resultsGraph)
    }

    const getTestAuditResults = (test) => {

        if (!test) return null

        const currentTestIdAndRetry = `${test.id}-${test._currentRetry}`

        const testAudit = specAudit.get(currentTestIdAndRetry)
        const testStartTime = testAudit.testStartTime
        const commandsEnqueuedIterator = testAudit.commandsEnqueued.values()

        // Get the first command enqueued data
        const commandEnqueuedData = commandsEnqueuedIterator.next().value;

        // Process all the commands of the test and return a directed graph with the commands as nodes
        let resultsGraph = processCommand({ currentTestIdAndRetry, commandEnqueuedData, prevCommandId: null }, new Map())

        resultsGraph = setPrevQueuedCommandAndNestedLevel(resultsGraph, 0)

        return { resultsGraph, testStartTime }

    }

    const setPrevQueuedCommandAndNestedLevel = (resultsGraph, nestedLevel = 0) => {
        if (!resultsGraph || typeof resultsGraph.forEach !== 'function') return resultsGraph

        const visited = new Set()

        const traverse = (commandId) => {
            if (!commandId || visited.has(commandId)) return
            const node = resultsGraph.get(commandId)
            if (!node) {
                visited.add(commandId)
                return
            }

            visited.add(commandId)

            const nextQueuedId = node.nextQueuedCommandId
            if (nextQueuedId && resultsGraph.has(nextQueuedId)) {
                const nextQueuedNode = resultsGraph.get(nextQueuedId)
                if (nextQueuedNode) {
                    nextQueuedNode.prevQueuedCommandId = node.id
                }
                traverse(nextQueuedId)
            }

            const nextCommandId = node.nextCommandId
            if (nextCommandId && resultsGraph.has(nextCommandId)) {
                traverse(nextCommandId)
            }
        }

        for (const commandId of resultsGraph.keys()) {
            traverse(commandId)
        }

        const levelMemo = new Map()
        const resolving = new Set()

        const getQueueOrder = (node) => typeof node?.queueInsertionOrder === 'number' ? node.queueInsertionOrder : null

        const assignNestedLevel = (commandId) => {
            if (!commandId) return nestedLevel
            if (levelMemo.has(commandId)) return levelMemo.get(commandId)
            if (resolving.has(commandId)) return nestedLevel

            const node = resultsGraph.get(commandId)
            if (!node) {
                levelMemo.set(commandId, nestedLevel)
                return nestedLevel
            }

            resolving.add(commandId)

            let level = nestedLevel
            if (!node.prevCommandId) {
                level = nestedLevel
            } else {
                const prevNode = resultsGraph.get(node.prevCommandId)
                const prevLevel = assignNestedLevel(node.prevCommandId)
                const prevQueueOrder = getQueueOrder(prevNode)
                const currentQueueOrder = getQueueOrder(node)

                if (prevQueueOrder !== null && currentQueueOrder !== null) {
                    if (currentQueueOrder === prevQueueOrder + 1) {
                        level = prevLevel
                    } else if (currentQueueOrder > prevQueueOrder) {
                        level = node.runnableType && node.runnableType !== 'test'
                            ? prevLevel
                            : prevLevel + 1
                    } else if (currentQueueOrder < prevQueueOrder) {
                        if (node.prevQueuedCommandId && resultsGraph.has(node.prevQueuedCommandId)) {
                            level = assignNestedLevel(node.prevQueuedCommandId)
                        } else {
                            level = nestedLevel
                        }
                    } else {
                        level = prevLevel
                    }
                } else {
                    level = prevLevel
                }
            }

            node.nestedLevel = level
            levelMemo.set(commandId, level)
            resolving.delete(commandId)
            return level
        }

        for (const commandId of resultsGraph.keys()) {
            assignNestedLevel(commandId)
        }

        return resultsGraph
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
        const currentTestId = test.id
        const currentRetry = test._currentRetry

        // Get the test audit results
        const { resultsGraph, testStartTime } = getTestAuditResults(test)

        // console.log('#################################### test')
        // console.log(Cypress.spec)
        // console.log(cy.state())
        // console.log(test)
        // console.log('####################################')

        // console.log('#################################### resultsGraph')
        // console.log(resultsGraph)
        // console.log('####################################')

        if (!resultsGraph) return

        // Display the test ausig results in the browser condole/terminal console
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


        // Info for a test definition
        if (!testAuditResults.has(currentTestId)) {
            // Ensure nested map structure: testAuditResults.get(currentTestId) is a Map of retries->result
            testAuditResults.set(currentTestId, {
                testTitle: test.title, 
                maxRetries: test._retries, 
                retriesInfo: [] 
            });
        }

        // Info specific for each test retry
        const retriesInfo = { 
            currentRetry, 
            testStartTime, 
            resultsGraph
        }
        testAuditResults.get(currentTestId).retriesInfo[currentRetry] = retriesInfo;

    })

    after(() => {
        if (Cypress.env('createFlakyTestAuditReport') === true || Cypress.env('createFlakyTestAuditReport') === 'true') {
            // If the report is configured to be created, create it
            // sending the spec and the testAuditResults map
            Report.createSuiteAuditHtmlReport(Cypress.spec, testAuditResults)
        }
    })
}

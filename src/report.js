// https://github.com/visjs/vis-network
// https://visjs.github.io/vis-network/docs/network/


import Utils from './utils'

// **********************************************************************************
// CONSTANTS
// **********************************************************************************

// const 
// const createFlakyTestAuditHtmlReport = (spec, testAuditResults) => {
//     const auditReportName = spec.name

//     return `
// <!doctype html>
// <html>
//   <head>
//     <title>Flaky Test Audit Report Suite - ${spec.fileName}</title>

//     <style>
//       body,
//       html {
//         font-family: arial, sans-serif;
//         font-size: 11pt;
//       }

//       #visualization {
//         box-sizing: border-box;
//         width: 100%;
//         height: 300px;
//       }
//     </style>
//         <!-- note: moment.js must be loaded before vis-timeline-graph2d or the embedded version of moment.js is used -->
//     <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script>

//     <script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
//     <link
//       href=".https://unpkg.com/vis-timeline@latesthttps://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css"
//       rel="stylesheet"
//       type="text/css"
//     />
//   </head>
//   <body>
//     <h1>Flaky Test Audit Report - ${spec.fileName}</h1>
//     <div>Suite: ${spec.relative}</div>
//     <div>Number of tests executed${spec.name}</div>
//   </body>
// </html>
// `
// }

// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

const createSuiteAuditHtmlReport = (spec, testAuditResults) => {
    console.log('------------------------------------------------------------- createFlakyTestAuditReport')
    console.log(spec)
    console.log(testAuditResults)

    const htmlReport = createSuiteAuditHtml(spec, testAuditResults)
    console.log(htmlReport)
    const dateStr = new Date().toISOString().replace(/[:]/g, '-');
    cy.writeFile(
        Cypress.config('testAuditFolder') +
        spec.fileName +
        "_" +
        dateStr +
        '.html',
        htmlReport
    );
}


const createSuiteAuditHtml = (spec, testAuditResults) => {
    console.log('------------------------------------------------------------- createFlakyTestAuditReport')
    console.log(spec)
    console.log(testAuditResults)

    // Utility function to escape HTML
    function esc(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Generate a graph for commands, stacking nested executions over the queue timeline.
    function generateGraphHtml(resultsGraph, graphContainerId) {
        // Flatten Map to object for easier access
        const commands = resultsGraph instanceof Map
            ? Object.fromEntries(resultsGraph)
            : { ...resultsGraph };

        const commandIds = Object.keys(commands);
        if (!commandIds.length) {
            return `<div id="${esc(graphContainerId)}" class="command-graph-wrapper"><div class="command-graph" style="display:flex;align-items:center;justify-content:center;color:#999;border:none;">No commands captured</div></div>`;
        }

        const queueOrderedIds = commandIds
            .slice()
            .sort((a, b) => {
                const aOrder = commands[a]?.queueInsertionOrder ?? Number.MAX_SAFE_INTEGER;
                const bOrder = commands[b]?.queueInsertionOrder ?? Number.MAX_SAFE_INTEGER;
                if (aOrder === bOrder) {
                    return (commands[a]?.startTime ?? 0) - (commands[b]?.startTime ?? 0);
                }
                return aOrder - bOrder;
            });

        const queueIndexById = {};
        queueOrderedIds.forEach((id, idx) => {
            queueIndexById[id] = idx;
        });

        const startCandidates = queueOrderedIds.filter(id => !commands[id].prevCommandId);
        const depthById = computeExecutionDepths(
            queueOrderedIds,
            startCandidates.length ? startCandidates : [queueOrderedIds[0]],
            commands
        );

        const durations = queueOrderedIds
            .map(id => getDuration(commands[id]))
            .filter(value => Number.isFinite(value) && value > 0);

        const maxDuration = durations.length ? Math.max(...durations) : 0;
        const minBoxWidth = 70;
        const maxBoxWidth = 400;
        const horizontalSpacing = 160;
        const verticalSpacing = 95;
        const nodeBaseY = 40; // keep queue on a visible baseline

        const groupsMeta = {};
        const tooltipByNode = {};

        const nodes = queueOrderedIds.map(id => {
            const cmd = commands[id];
            const duration = getDuration(cmd);
            const hasDuration = duration > 0;
            const labelParts = [`${cmd.name+'()' || 'command'}`];
            // const argsPreview = formatArgs(cmd.args);
            const argsPreview = '()'
            // if (argsPreview) labelParts.push(argsPreview);
            if (hasDuration) labelParts.push(`${Math.round(duration)} ms`);

            const colorByState = {
                passed: '#2e7d32',
                failed: '#c62828',
                pending: '#f9a825'
            };
            const nodeColor = colorByState[cmd.state] || '#546e7a';

            const width = hasDuration
                ? Math.max(
                    minBoxWidth,
                    maxDuration ? (duration / maxDuration) * maxBoxWidth : minBoxWidth
                )
                : undefined;

            const depth = depthById[id] || 0;
            const subgroupName = `level-${depth}`;
            groupsMeta[subgroupName] = groupsMeta[subgroupName] || {};

            const nodeY = nodeBaseY - depth * verticalSpacing;
            const tooltipHtml = buildTooltip(cmd, duration);
            const node = {
                id,
                group: subgroupName,
                label: labelParts.join('\n'),
                x: queueIndexById[id] * horizontalSpacing,
                y: nodeY,
                fixed: true,
                color: { background: nodeColor, border: '#263238', highlight: { background: nodeColor, border: '#000' } },
                font: { face: 'monospace', align: 'left', multi: 'md', color: '#fff' },
                tooltip: tooltipHtml
            };
            tooltipByNode[id] = tooltipHtml;

            if (hasDuration) {
                node.shape = 'box';
                node.widthConstraint = { minimum: width, maximum: width };
            } else {
                node.shape = 'dot';
                node.size = 10;
                node.font = { face: 'monospace', color: '#263238', align: 'center' };
            }

            return node;
        });

        const edges = [];

        // Actual execution flow (nextCommandId)
        queueOrderedIds.forEach(id => {
            const cmd = commands[id];
            if (cmd.nextCommandId && commands[cmd.nextCommandId]) {
                edges.push({
                    from: id,
                    to: cmd.nextCommandId,
                    arrows: 'to',
                    color: '#1976d2',
                    width: 2,
                    smooth: {
                        type: 'cubicBezier',
                        roundness: depthById[cmd.nextCommandId] > depthById[id] ? 0.3 : 0.05
                    }
                });
            }
        });

        const wrapperId = `${graphContainerId}_wrapper`;
        const tooltipId = `${graphContainerId}_tooltip`;

        return `
            <div id="${esc(wrapperId)}" class="command-graph-wrapper">
                <div id="${esc(graphContainerId)}" class="command-graph"></div>
                <div id="${esc(tooltipId)}" class="command-tooltip" role="tooltip" aria-hidden="true"></div>
            </div>
            <script>
            (function() {
                var nodes = new vis.DataSet(${JSON.stringify(nodes)});
                var edges = new vis.DataSet(${JSON.stringify(edges)});
                var groups = ${JSON.stringify(groupsMeta)};
                var nodeTooltips = ${JSON.stringify(tooltipByNode)};
                var container = document.getElementById("${esc(graphContainerId)}");
                var tooltip = document.getElementById("${esc(tooltipId)}");
                var data = { nodes: nodes, edges: edges };
                var options = {
                    clickToUse: true,
                    groups: groups,
                    physics: false,
                    layout: {
                      improvedLayout: true,
                      hierarchical: { 
                        direction: "UD",
                        sortMethod: "directed",
                        levelSeparation: 80,
                        nodeSpacing: 80,
                        treeSpacing: 150
                      } 
                    },
                    interaction: {
                        dragNodes: false,
                        hover: false
                    },
                    edges: {
                        smooth: false
                    }
                };
                var network = new vis.Network(container, data, options);

                function hideTooltip() {
                    if (!tooltip) return;
                    tooltip.style.display = 'none';
                    tooltip.setAttribute('aria-hidden', 'true');
                }

                network.on('click', function(params) {
                    if (!tooltip) return;
                    if (params.nodes && params.nodes.length) {
                        var nodeId = params.nodes[0];
                        var html = nodeTooltips[nodeId];
                        if (!html) {
                            hideTooltip();
                            return;
                        }
                        tooltip.innerHTML = html;
                        tooltip.style.display = 'block';
                        tooltip.setAttribute('aria-hidden', 'false');

                        requestAnimationFrame(function() {
                            var pointer = params.pointer.DOM;
                            var maxLeft = Math.max(container.clientWidth - tooltip.offsetWidth - 8, 8);
                            var maxTop = Math.max(container.clientHeight - tooltip.offsetHeight - 8, 8);
                            var left = Math.min(Math.max(pointer.x + 12, 8), maxLeft);
                            var top = Math.min(Math.max(pointer.y + 12, 8), maxTop);
                            tooltip.style.left = left + 'px';
                            tooltip.style.top = top + 'px';
                        });
                    } else {
                        hideTooltip();
                    }
                });

                network.on('dragStart', hideTooltip);
                network.on('zoom', hideTooltip);
                container.addEventListener('mouseleave', hideTooltip);
            })();
            </script>
        `;

        function getDuration(cmd) {
            if (!cmd) return 0;
            if (typeof cmd.durationPerformance === 'number') return cmd.durationPerformance;
            if (typeof cmd.duration === 'number') return cmd.duration;
            return 0;
        }

        function formatArgs(args) {
            if (!Array.isArray(args) || !args.length) return '';
            let rendered;
            const formatter = Utils && Utils.formatCommandArgs;
            if (typeof formatter === 'function') {
                rendered = formatter.call(Utils, args, 'terminalConsole');
            } else {
                rendered = JSON.stringify(args);
            }
            const normalized = typeof rendered === 'string' ? rendered : JSON.stringify(rendered);
            return normalized.length > 42 ? normalized.slice(0, 39) + '…' : normalized;
        }
        
        function buildTooltip(cmd, duration) {
            const argsText = cmd.args ? formatArgs(cmd.args) : '';
            const info = [
                `<div><strong>Command:</strong> ${esc(cmd.name || 'command')}</div>`,
                argsText ? `<div><strong>Args:</strong> ${esc(argsText)}</div>` : '',
                `<div><strong>State:</strong> ${esc(cmd.state || 'unknown')}</div>`,
                `<div><strong>Queue order:</strong> ${esc(cmd.queueInsertionOrder ?? '-')}</div>`,
                `<div><strong>Execution order:</strong> ${esc(cmd.executionOrder ?? '-')}</div>`,
                `<div><strong>Duration:</strong> ${esc(duration > 0 ? Math.round(duration) + ' ms' : 'n/a')}</div>`
            ];
            return info.filter(Boolean).join('');
        }

        function computeExecutionDepths(orderIds, startIds, commandsMap) {
            const depthMap = {};
            const seen = new Set();

            const traverse = (startId) => {
                let currentId = startId;
                let currentDepth = depthMap[startId] ?? 0;
                const resumeStack = [];

                while (currentId && commandsMap[currentId] && !seen.has(currentId)) {
                    depthMap[currentId] = depthMap[currentId] ?? currentDepth;
                    seen.add(currentId);

                    const current = commandsMap[currentId];
                    const actualNext = current.nextCommandId;
                    if (!actualNext || !commandsMap[actualNext]) break;

                    const queueNext = current.nextQueuedCommandId;
                    if (queueNext && actualNext !== queueNext) {
                        resumeStack.push({ resumeId: queueNext, depth: currentDepth });
                        currentDepth += 1;
                    } else {
                        while (resumeStack.length && actualNext === resumeStack[resumeStack.length - 1].resumeId) {
                            currentDepth = resumeStack.pop().depth;
                        }
                    }

                    if (seen.has(actualNext)) break;
                    depthMap[actualNext] = depthMap[actualNext] ?? currentDepth;
                    currentId = actualNext;
                }
            };

            startIds.forEach(traverse);
            orderIds.forEach(id => {
                if (!seen.has(id)) traverse(id);
            });
            orderIds.forEach(id => {
                if (depthMap[id] === undefined) depthMap[id] = 0;
            });

            return depthMap;
        }
    }

    // Compose HTML for suite audit report
    let suiteInfoHtml = `
        <h1>Flaky Test Audit Report</h1>
        <div><b>Suite File Name:</b> ${esc(spec.fileName)}</div>
        <div><b>Relative Path:</b> ${esc(spec.relative)}</div>
        <div><b>Number of Tests:</b> ${testAuditResults.size}</div>
    `;
    let allTestsHtml = "";

    // testAuditResults: Map of testId (string) => {testTitle, maxRetries, retriesInfo}
    let testIdx = 0;
    for (const [testId, testData] of testAuditResults.entries()) {
        let testHtml = `<section style="margin:2em 0"><h2>Test: ${esc(testData.testTitle)}</h2>
            <div>Test ID: ${esc(testId)}</div>
            <div>Max Retries: ${testData.maxRetries}</div>
        `;
        // Iterate its retries
        if (Array.isArray(testData.retriesInfo)) {
            testData.retriesInfo.forEach((retry, retryIdx) => {
                const containerId = `graph_${testIdx}_${retryIdx}`;
                testHtml += `
                    <div style="margin:1em 0 1em 1em; border:1px dashed #aaa; background:#f8f8f8;">
                        <div><b>Retry #${retry.currentRetry} Start Time:</b> ${retry.testStartTime ? new Date(retry.testStartTime).toLocaleString() : ''}</div>
                        <div><b>Commands Graph:</b></div>
                        ${generateGraphHtml(retry.resultsGraph, containerId)}
                    </div>
                `;
            });
        } else {
            testHtml += "<div>No retry information.</div>";
        }
        testHtml += "</section>";
        allTestsHtml += testHtml;
        testIdx++;
    }

    return `
<!doctype html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Flaky Test Audit Report Suite - ${esc(spec.fileName)}</title>
    <style>
        body { font-family: arial, sans-serif; font-size: 13px; background: #fcfcfc; }
        h1 { color: #37474f; }
        h2 { color: #0277bd; margin-top:1.5em }
        .command-graph-wrapper { background: #fff; border: 1px solid #eee; margin-bottom: 2em; position: relative; height: 800px; }
        .command-graph-wrapper .command-graph { position: absolute; inset: 0; }
        .command-tooltip {
            position: absolute;
            display: none;
            max-width: 350px;
            padding: 8px 10px;
            border-radius: 4px;
            background: rgba(38, 50, 56, 0.95);
            color: #fff;
            font-size: 11px;
            line-height: 1.4;
            pointer-events: crosshair;
            box-shadow: 0 6px 18px rgba(0,0,0,0.35);
            z-index: 5;
        }
        .command-tooltip strong { display: inline-block; min-width: 90px; font-weight: 600; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css" rel="stylesheet"/>
</head>
<body>
    ${suiteInfoHtml}
    ${allTestsHtml}
</body>
</html>
    `;

}


// **********************************************************************************
// PRIVATE FUNCTIONS
// **********************************************************************************



export default {
    createSuiteAuditHtmlReport,
}

// // Example of a Cypress spec object
// {
//     "id": "U3BlYzpDOi9QZXJzb25hbC9HaXRIdWJfUmVwb3MvY3lwcmVzcy1mbGFreS10ZXN0LWF1ZGl0L2N5cHJlc3MvZTJlL2ZsYWt5LWRlbW8yLmN5Lmpz",
//     "name": "flaky-demo2.cy.js",
//     "specType": "integration",
//     "absolute": "C:/Personal/GitHub_Repos/cypress-flaky-test-audit/cypress/e2e/flaky-demo2.cy.js",
//     "baseName": "flaky-demo2.cy.js",
//     "fileName": "flaky-demo2",
//     "specFileExtension": ".cy.js",
//     "fileExtension": ".js",
//     "relative": "cypress\\e2e\\flaky-demo2.cy.js",
//     "__typename": "Spec"
// }



// // Example of structure containing all tests in a suite and for each test the retries and the results direction graph for each of the retries
// new Map([
//     [
//         "r3",
//         {
//             "testTitle": "test 1",
//             "maxRetries": 1,
//             "retriesInfo": [
//                 {
//                     "currentRetry": 0,
//                     "testStartTime": 1766074933989,
//                     "resultsGraph": new Map([
//                         [
//                             "ch-https://automationintesting.online-482-cmd-806",
//                             {
//                                 "id": "ch-https://automationintesting.online-482-cmd-806",
//                                 "name": "visit",
//                                 "args": [
//                                     "https://automationintesting.online/"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "before each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766074934099,
//                                 "enqueuedTimePerformance": 110.09999996423721,
//                                 "startTime": 1766074934100,
//                                 "startTimePerformance": 110.30000001192093,
//                                 "endTime": 1766074934957,
//                                 "endTimePerformance": 967.3999999761581,
//                                 "duration": 857,
//                                 "durationPerformance": 857.0999999642372,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 0,
//                                 "executionOrder": 0,
//                                 "nextCommandId": "ch-https://automationintesting.online-483-cmd-807",
//                                 "prevCommandId": null,
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-483-cmd-807"
//                             }
//                         ],
//                         [
//                             "ch-https://automationintesting.online-500-cmd-836",
//                             {
//                                 "id": "ch-https://automationintesting.online-500-cmd-836",
//                                 "name": "get",
//                                 "args": [
//                                     "#contact input[data-testid=\"ContactName\"]"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 829.6000000238419,
//                                 "startTime": 1766075398097,
//                                 "startTimePerformance": 831,
//                                 "endTime": 1766075398668,
//                                 "endTimePerformance": 1402.3999999761581,
//                                 "duration": 571,
//                                 "durationPerformance": 571.3999999761581,
//                                 "retries": 25,
//                                 "queueInsertionOrder": 1,
//                                 "executionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-500-cmd-837",
//                                 "prevCommandId": "ch-https://automationintesting.online-499-cmd-835",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-500-cmd-837"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-500-cmd-837",
//                             {
//                                 "id": "ch-https://automationintesting.online-500-cmd-837",
//                                 "name": "type",
//                                 "args": [
//                                     "paul mcCartney",
//                                     {
//                                         "delay": 200
//                                     }
//                                 ],
//                                 "type": "child",
//                                 "runnableType": "test",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830,
//                                 "startTime": 1766075398669,
//                                 "startTimePerformance": 1402.3999999761581,
//                                 "endTime": 1766075401816,
//                                 "endTimePerformance": 4549.5,
//                                 "duration": 3147,
//                                 "durationPerformance": 3147.100000023842,
//                                 "retries": 2,
//                                 "queueInsertionOrder": 2,
//                                 "executionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-838",
//                                 "prevCommandId": "ch-https://automationintesting.online-500-cmd-836",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-838"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-507-cmd-849",
//                             {
//                                 "id": "ch-https://automationintesting.online-507-cmd-849",
//                                 "name": "visit",
//                                 "args": [
//                                     "https://automationintesting.online/"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "before each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075406005,
//                                 "enqueuedTimePerformance": 60,
//                                 "startTime": 1766075406005,
//                                 "startTimePerformance": 60.30000001192093,
//                                 "endTime": 1766075406776,
//                                 "endTimePerformance": 831.3999999761581,
//                                 "duration": 771,
//                                 "durationPerformance": 771.0999999642372,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 0,
//                                 "executionOrder": 0,
//                                 "nextCommandId": "ch-https://automationintesting.online-508-cmd-850",
//                                 "prevCommandId": null,
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-508-cmd-850"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-501-cmd-839",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-839",
//                                 "name": "should",
//                                 "args": [
//                                     "have.value",
//                                     "paul mcCartney"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "failed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.1999999880791,
//                                 "queueInsertionOrder": 4,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-840",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-838",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-840"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-501-cmd-840",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-840",
//                                 "name": "and",
//                                 "args": [
//                                     "have.class",
//                                     "form-control"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.3000000119209,
//                                 "queueInsertionOrder": 5,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-841",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-839",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-841"
//                             }

//                         ],
//                         [

//                             "ch-https://automationintesting.online-501-cmd-841",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-841",
//                                 "name": "and",
//                                 "args": [
//                                     "have.css",
//                                     "color",
//                                     "red"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.3000000119209,
//                                 "queueInsertionOrder": 6,
//                                 "nextCommandId": "ch-https://automationintesting.online-502-cmd-842",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-840",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-502-cmd-842"
//                             }

//                         ],
//                         [

//                             "ch-https://automationintesting.online-502-cmd-842",
//                             {
//                                 "id": "ch-https://automationintesting.online-502-cmd-842",
//                                 "name": "wait",
//                                 "args": [
//                                     500
//                                 ],
//                                 "type": "dual",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.5,
//                                 "queueInsertionOrder": 7,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-843",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-841",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-843"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-843",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-843",
//                                 "name": "get",
//                                 "args": [
//                                     "#contact button"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.6000000238419,
//                                 "queueInsertionOrder": 8,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-844",
//                                 "prevCommandId": "ch-https://automationintesting.online-502-cmd-842",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-844"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-844",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-844",
//                                 "name": "contains",
//                                 "args": [
//                                     "Submit"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.6999999880791,
//                                 "queueInsertionOrder": 9,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-845",
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-843",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-845"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-845",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-845",
//                                 "name": "click",
//                                 "args": [],
//                                 "type": "child",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.8999999761581,
//                                 "queueInsertionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-504-cmd-846",
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-844",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-504-cmd-846"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-504-cmd-846",
//                             {
//                                 "id": "ch-https://automationintesting.online-504-cmd-846",
//                                 "name": "log",
//                                 "args": [
//                                     "--- one last command in beforeEach"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "after each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075405825,
//                                 "enqueuedTimePerformance": 8559.199999988079,
//                                 "startTime": 1766075405826,
//                                 "startTimePerformance": 8559.5,
//                                 "endTime": 1766075405828,
//                                 "endTimePerformance": 8561.5,
//                                 "duration": 2,
//                                 "durationPerformance": 2,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 11,
//                                 "executionOrder": 11,
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-845",
//                                 "nextQueuedCommandId": null
//                             }

//                         ]

//                     ])
//                 },
//                 {
//                     "currentRetry": 1,
//                     "testStartTime": 1766074943254,
//                     "resultsGraph": {}
//                 }
//             ]
//         }
//     ],
//     [
//         "r4",
//         {
//             "testTitle": "test 2",
//             "maxRetries": 1,
//             "retriesInfo": [
//                 {
//                     "currentRetry": 0,
//                     "testStartTime": 1766074933989,
//                     "resultsGraph": new Map([
//                         [
//                             "ch-https://automationintesting.online-482-cmd-806",
//                             {
//                                 "id": "ch-https://automationintesting.online-482-cmd-806",
//                                 "name": "visit",
//                                 "args": [
//                                     "https://automationintesting.online/"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "before each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766074934099,
//                                 "enqueuedTimePerformance": 110.09999996423721,
//                                 "startTime": 1766074934100,
//                                 "startTimePerformance": 110.30000001192093,
//                                 "endTime": 1766074934957,
//                                 "endTimePerformance": 967.3999999761581,
//                                 "duration": 857,
//                                 "durationPerformance": 857.0999999642372,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 0,
//                                 "executionOrder": 0,
//                                 "nextCommandId": "ch-https://automationintesting.online-483-cmd-807",
//                                 "prevCommandId": null,
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-483-cmd-807"
//                             }
//                         ],
//                         [
//                             "ch-https://automationintesting.online-500-cmd-836",
//                             {
//                                 "id": "ch-https://automationintesting.online-500-cmd-836",
//                                 "name": "get",
//                                 "args": [
//                                     "#contact input[data-testid=\"ContactName\"]"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 829.6000000238419,
//                                 "startTime": 1766075398097,
//                                 "startTimePerformance": 831,
//                                 "endTime": 1766075398668,
//                                 "endTimePerformance": 1402.3999999761581,
//                                 "duration": 571,
//                                 "durationPerformance": 571.3999999761581,
//                                 "retries": 25,
//                                 "queueInsertionOrder": 1,
//                                 "executionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-500-cmd-837",
//                                 "prevCommandId": "ch-https://automationintesting.online-499-cmd-835",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-500-cmd-837"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-500-cmd-837",
//                             {
//                                 "id": "ch-https://automationintesting.online-500-cmd-837",
//                                 "name": "type",
//                                 "args": [
//                                     "paul mcCartney",
//                                     {
//                                         "delay": 200
//                                     }
//                                 ],
//                                 "type": "child",
//                                 "runnableType": "test",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830,
//                                 "startTime": 1766075398669,
//                                 "startTimePerformance": 1402.3999999761581,
//                                 "endTime": 1766075401816,
//                                 "endTimePerformance": 4549.5,
//                                 "duration": 3147,
//                                 "durationPerformance": 3147.100000023842,
//                                 "retries": 2,
//                                 "queueInsertionOrder": 2,
//                                 "executionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-838",
//                                 "prevCommandId": "ch-https://automationintesting.online-500-cmd-836",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-838"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-507-cmd-849",
//                             {
//                                 "id": "ch-https://automationintesting.online-507-cmd-849",
//                                 "name": "visit",
//                                 "args": [
//                                     "https://automationintesting.online/"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "before each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075406005,
//                                 "enqueuedTimePerformance": 60,
//                                 "startTime": 1766075406005,
//                                 "startTimePerformance": 60.30000001192093,
//                                 "endTime": 1766075406776,
//                                 "endTimePerformance": 831.3999999761581,
//                                 "duration": 771,
//                                 "durationPerformance": 771.0999999642372,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 0,
//                                 "executionOrder": 0,
//                                 "nextCommandId": "ch-https://automationintesting.online-508-cmd-850",
//                                 "prevCommandId": null,
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-508-cmd-850"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-501-cmd-839",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-839",
//                                 "name": "should",
//                                 "args": [
//                                     "have.value",
//                                     "paul mcCartney"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "failed",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.1999999880791,
//                                 "queueInsertionOrder": 4,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-840",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-838",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-840"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-501-cmd-840",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-840",
//                                 "name": "and",
//                                 "args": [
//                                     "have.class",
//                                     "form-control"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.3000000119209,
//                                 "queueInsertionOrder": 5,
//                                 "nextCommandId": "ch-https://automationintesting.online-501-cmd-841",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-839",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-501-cmd-841"
//                             }

//                         ],
//                         [

//                             "ch-https://automationintesting.online-501-cmd-841",
//                             {
//                                 "id": "ch-https://automationintesting.online-501-cmd-841",
//                                 "name": "and",
//                                 "args": [
//                                     "have.css",
//                                     "color",
//                                     "red"
//                                 ],
//                                 "type": "assertion",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398096,
//                                 "enqueuedTimePerformance": 830.3000000119209,
//                                 "queueInsertionOrder": 6,
//                                 "nextCommandId": "ch-https://automationintesting.online-502-cmd-842",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-840",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-502-cmd-842"
//                             }

//                         ],
//                         [

//                             "ch-https://automationintesting.online-502-cmd-842",
//                             {
//                                 "id": "ch-https://automationintesting.online-502-cmd-842",
//                                 "name": "wait",
//                                 "args": [
//                                     500
//                                 ],
//                                 "type": "dual",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.5,
//                                 "queueInsertionOrder": 7,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-843",
//                                 "prevCommandId": "ch-https://automationintesting.online-501-cmd-841",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-843"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-843",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-843",
//                                 "name": "get",
//                                 "args": [
//                                     "#contact button"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.6000000238419,
//                                 "queueInsertionOrder": 8,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-844",
//                                 "prevCommandId": "ch-https://automationintesting.online-502-cmd-842",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-844"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-844",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-844",
//                                 "name": "contains",
//                                 "args": [
//                                     "Submit"
//                                 ],
//                                 "query": true,
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.6999999880791,
//                                 "queueInsertionOrder": 9,
//                                 "nextCommandId": "ch-https://automationintesting.online-503-cmd-845",
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-843",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-503-cmd-845"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-503-cmd-845",
//                             {
//                                 "id": "ch-https://automationintesting.online-503-cmd-845",
//                                 "name": "click",
//                                 "args": [],
//                                 "type": "child",
//                                 "runnableType": "test",
//                                 "state": "queued",
//                                 "enqueuedTime": 1766075398097,
//                                 "enqueuedTimePerformance": 830.8999999761581,
//                                 "queueInsertionOrder": 10,
//                                 "nextCommandId": "ch-https://automationintesting.online-504-cmd-846",
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-844",
//                                 "nextQueuedCommandId": "ch-https://automationintesting.online-504-cmd-846"
//                             }

//                         ],
//                         [
//                             "ch-https://automationintesting.online-504-cmd-846",
//                             {
//                                 "id": "ch-https://automationintesting.online-504-cmd-846",
//                                 "name": "log",
//                                 "args": [
//                                     "--- one last command in beforeEach"
//                                 ],
//                                 "type": "parent",
//                                 "runnableType": "after each",
//                                 "state": "passed",
//                                 "enqueuedTime": 1766075405825,
//                                 "enqueuedTimePerformance": 8559.199999988079,
//                                 "startTime": 1766075405826,
//                                 "startTimePerformance": 8559.5,
//                                 "endTime": 1766075405828,
//                                 "endTimePerformance": 8561.5,
//                                 "duration": 2,
//                                 "durationPerformance": 2,
//                                 "retries": 0,
//                                 "queueInsertionOrder": 11,
//                                 "executionOrder": 11,
//                                 "prevCommandId": "ch-https://automationintesting.online-503-cmd-845",
//                                 "nextQueuedCommandId": null
//                             }

//                         ]

//                     ])
//                 },
//                 {
//                     "currentRetry": 1,
//                     "testStartTime": 1766074943254,
//                     "resultsGraph": {}
//                 }
//             ]
//         }
//     ]
// ])



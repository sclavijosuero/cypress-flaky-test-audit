// https://github.com/visjs/vis-network
// https://visjs.github.io/vis-network/docs/network/


import Utils from './utils'

// **********************************************************************************
// CONSTANTS
// **********************************************************************************


// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

const createSuiteAuditHtmlReport = (spec, testAuditResults) => {
    console.log('------------------------------------------------------------- createFlakyTestAuditReport')
    console.log(spec)
    console.log(testAuditResults)

    const htmlReport = createSuiteAuditHtml(spec, testAuditResults)

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

        const tooltipByNode = {};
        const dotLabels = {};

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
            const nodeY = nodeBaseY - depth * verticalSpacing;
            const tooltipHtml = buildTooltip(cmd, duration);
            const node = {
                id,
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
                node.font.align = 'center';
            } else {
                node.shape = 'dot';
                node.size = 10;
                node.label = '';
                node.font = { face: 'monospace', color: '#263238', align: 'left' };
                dotLabels[id] = labelParts.join(' ');
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
        const labelsId = `${graphContainerId}_labels`;

        return `
            <div id="${esc(wrapperId)}" class="command-graph-wrapper">
                <div id="${esc(graphContainerId)}" class="command-graph"></div>
                <div id="${esc(labelsId)}" class="dot-label-layer" aria-hidden="true"></div>
                <div id="${esc(tooltipId)}" class="command-tooltip" role="tooltip" aria-hidden="true"></div>
            </div>
            <script>
            (function() {
                var nodes = new vis.DataSet(${JSON.stringify(nodes)});
                var edges = new vis.DataSet(${JSON.stringify(edges)});
                var nodeTooltips = ${JSON.stringify(tooltipByNode)};
                var dotLabels = ${JSON.stringify(dotLabels)};
                var dotLabelIds = Object.keys(dotLabels);
                var container = document.getElementById("${esc(graphContainerId)}");
                var tooltip = document.getElementById("${esc(tooltipId)}");
                var labelLayer = document.getElementById("${esc(labelsId)}");
                var data = { nodes: nodes, edges: edges };
                var options = {
                    height: '100%',
                    width: '100%',
                    clickToUse: true,
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
                        smooth: true
                    }
                };
                var network = new vis.Network(container, data, options);
                network.once('afterDrawing', function () {
                    network.fit({ animation: false });
                });
                network.on('afterDrawing', renderDotLabels);
                network.on('zoom', renderDotLabels);
                network.on('dragEnd', renderDotLabels);

                function hideTooltip() {
                    if (!tooltip) return;
                    tooltip.style.display = 'none';
                    tooltip.setAttribute('aria-hidden', 'true');
                }

                function renderDotLabels() {
                    if (!labelLayer || !dotLabelIds.length) return;
                    labelLayer.innerHTML = "";
                    var positions = network.getPositions(dotLabelIds);
                    dotLabelIds.forEach(function(id) {
                        var pos = positions[id];
                        if (!pos) return;
                        var domPos = network.canvasToDOM(pos);
                        var labelEl = document.createElement('span');
                        labelEl.textContent = dotLabels[id];
                        labelEl.style.left = (domPos.x + 14) + 'px';
                        labelEl.style.top = domPos.y + 'px';
                        labelLayer.appendChild(labelEl);
                    });
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
            const retriesCount = testData.retriesInfo.length;
            const retryCards = testData.retriesInfo.map((retry, retryIdx) => {
                const containerId = `graph_${testIdx}_${retryIdx}`;
                return `
                    <div class="retry-card">
                        <div class="retry-meta">
                            <div><b>Retry #${retry.currentRetry} Start Time:</b> ${retry.testStartTime ? new Date(retry.testStartTime).toLocaleString() : ''}</div>
                            <div><b>Commands Graph:</b></div>
                        </div>
                        ${generateGraphHtml(retry.resultsGraph, containerId)}
                    </div>
                `;
            }).join('');

            testHtml += `
                <div class="retry-grid ${retriesCount > 1 ? 'multi' : 'single'}">
                    ${retryCards}
                </div>
            `;
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
        .retry-grid { display:flex; gap:20px; width:100%; margin:1em 0; }
        .retry-grid.single { flex-direction: column; }
        .retry-grid.multi { flex-wrap: nowrap; }
        .retry-card { flex:1 1 0; min-width:0; border:1px dashed #aaa; background:#f8f8f8; padding:1em; display:flex; flex-direction:column; gap:0.5em; }
        .retry-meta { font-size:12px; color:#37474f; }
        .command-graph-wrapper { background: #fff; border: 1px solid #eee; margin-bottom: 2em; position: relative; height: 700px; }
        .command-graph-wrapper .command-graph { position: absolute; inset: 0; }
        .dot-label-layer { position:absolute; inset:0; pointer-events:none; font: 11px monospace; color:#263238; }
        .dot-label-layer span { position:absolute; white-space:nowrap; transform: translateY(-50%); }
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


export default {
    createSuiteAuditHtmlReport,
}

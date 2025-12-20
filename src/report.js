// https://github.com/visjs/vis-network
// https://visjs.github.io/vis-network/docs/network/


import Utils from './utils'

// **********************************************************************************
// CONSTANTS
// **********************************************************************************

const colorByState = {
    passed: '#2e7d32',
    failed: '#c62828',
    pending: '#f9a825'
};

const emphasizeColor = (hexColor, factor = 0.35) => {
    if (typeof hexColor !== 'string' || !/^#([0-9a-f]{6})$/i.test(hexColor)) {
        return hexColor;
    }
    const num = parseInt(hexColor.slice(1), 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

const createSuiteAuditHtmlReport = (spec, testAuditResults) => {
    // console.log('------------------------------------------------------------- createFlakyTestAuditReport')
    // console.log(spec)
    // console.log(testAuditResults)

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


const getTestStatusDisplay = (status) => {
    const normalized = typeof status === 'string' ? status.toLowerCase() : '';
    switch (normalized) {
        case 'passed':
            return { label: 'Passed', className: 'test-status--passed', flag: '✔' };
        case 'failed':
            return { label: 'Failed', className: 'test-status--failed', flag: '✖' };
        case 'pending':
        case 'skipped':
            return { label: 'Skipped', className: 'test-status--skipped', flag: '➜' };
        default:
            return { label: 'Unknown', className: 'test-status--unknown', flag: '？' };
    }
};

const createSuiteAuditHtml = (spec, testAuditResults) => {
    const generatedAt = new Date().toLocaleString();

    const failedTestsCount = Array.from(testAuditResults.values()).filter(test => (test?.testStatus || '').toLowerCase() === 'failed').length;

    // Compose HTML for suite audit report
    let suiteInfoHtml = `
        <section class="suite-overview">
            <div class="suite-heading">
                <p class="eyebrow">Flaky Test Audit</p>
                <h1>${esc(spec.fileName)}</h1>
            </div>
            <div class="suite-stats">
                <article class="stat-card">
                    <span class="stat-label">Generated</span>
                    <span class="stat-value">${esc(generatedAt)}</span>
                </article>
                <article class="stat-card">
                    <span class="stat-label">Spec Path</span>
                    <span class="stat-value stat-value--small">${esc(spec.relative)}</span>
                </article>
                <article class="stat-card">
                    <span class="stat-label">Total Tests</span>
                    <span class="stat-value">${testAuditResults.size}</span>
                </article>
                <article class="stat-card stat-card--failed">
                    <span class="stat-label">Failed Tests</span>
                    <span class="stat-value">${failedTestsCount}</span>
                </article>
            </div>
        </section>
    `;
    let allTestsHtml = "";

    // testAuditResults: Map of testId (string) => {testTitle, maxRetries, retriesInfo}
    let testIdx = 0;
    for (const [testId, testData] of testAuditResults.entries()) {
        const statusDisplay = getTestStatusDisplay(testData.testStatus);
        let testHtml = `
        <section class="test-card">
            <header class="test-card__header">
                <div>
                    <p class="eyebrow eyebrow--dark">Test</p>
                    <h2>${esc(testData.testTitle)}</h2>
                </div>
                <div class="test-status ${statusDisplay.className}">
                    <span class="status-flag" aria-hidden="true">${statusDisplay.flag}</span>
                    <span class="status-label">${statusDisplay.label}</span>
                </div>
            </header>
        `;
        // Iterate its retries
        if (Array.isArray(testData.retriesInfo)) {
            const retriesCount = testData.retriesInfo.length;
            const retryCards = testData.retriesInfo.map((retry, retryIdx) => {
                const containerId = `graph_${testIdx}_${retryIdx}`;
                const retryLabel = testData.maxRetries > 0
                    ? `Retry ${retry.currentRetry} of ${testData.maxRetries}`
                    : 'Execution';
                const retryStatus = typeof retry.retryStatus === 'string' ? retry.retryStatus.toLowerCase() : '';
                const statusIcon = retryStatus === 'passed' ? '✔' : retryStatus === 'failed' ? '✖' : '➜';
                const chipClass = retryStatus === 'passed'
                    ? 'retry-status-chip retry-status-chip--passed'
                    : retryStatus === 'failed'
                        ? 'retry-status-chip retry-status-chip--failed'
                        : 'retry-status-chip retry-status-chip--unknown';
                const cardClass = retryStatus === 'passed'
                    ? 'retry-card retry-card--passed'
                    : retryStatus === 'failed'
                        ? 'retry-card retry-card--failed'
                        : 'retry-card retry-card--unknown';
                return `
                    <div class="${cardClass}">
                        <div class="retry-meta">
                            <div class="retry-meta__line">
                                <div class="${chipClass}" aria-label="${retryStatus || 'unknown'}">${statusIcon}</div>
                                <div class="retry-label"><b>${retryLabel}</b></div>
                            </div>
                            <div class="retry-meta__line retry-meta__line--time">
                                <div><b>Start time:</b> ${retry.testStartTime ? new Date(retry.testStartTime).toLocaleString() : ''}</div>
                            </div>
                            <div class="commands-graph-label">Commands Graph</div>
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
            testHtml += `<div class="empty-state">No retry information was captured for this test.</div>`;
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
        :root {
            --bg-accent: radial-gradient(circle at 20% 20%, rgba(14,165,233,0.25), transparent 42%),
                          radial-gradient(circle at 80% 0%, rgba(59,130,246,0.35), transparent 55%),
                          #020617;
            --text-primary: #0f172a;
            --text-muted: #475569;
            --border-color: rgba(15,23,42,0.08);
            --card-shadow: 0 24px 70px rgba(15,23,42,0.12);
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-accent);
            color: #e2e8f0;
        }
        .page {
            max-width: 1600px;
            margin: 0 auto;
            padding: 34px 32px 34px;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }
        .suite-overview {
            border-radius: 18px;
            padding: 20px;
            background: linear-gradient(140deg, rgba(59,130,246,0.92), rgba(14,165,233,0.75));
            color: #fff;
            box-shadow: 0 18px 40px rgba(15,23,42,0.22);
        }
        .suite-heading h1 {
            margin: 6px 0 4px;
            font-size: 26px;
            letter-spacing: -0.015em;
        }
        .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.35em;
            font-size: 11px;
            margin: 0;
        }
        .eyebrow--dark {
            color: var(--text-muted);
        }
        .suite-stats {
            margin-top: 14px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }
        @media (max-width: 790px) {
            .suite-stats {
                grid-template-columns: 1fr;
            }
        }
        .stat-card {
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 18px;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .stat-card--failed {
            background: rgba(239,68,68,0.18);
            border-color: rgba(239,68,68,0.95);
            box-shadow: 0 10px 25px rgba(239,68,68,0.35), inset 0 0 0 1px rgba(239,68,68,0.4);
        }
        .stat-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: rgba(255,255,255,0.75);
        }
        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #fff;
        }
        .stat-value--small {
            font-size: 15px;
            word-break: break-all;
        }
        .test-card {
            background: #fff;
            border-radius: 24px;
            padding: 28px;
            box-shadow: var(--card-shadow);
            color: var(--text-primary);
        }
        .test-card__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
        }
        .test-card__header h2 {
            margin: 4px 0 0;
            font-size: 26px;
            color: var(--text-primary);
        }
        .test-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.02em;
        }
        .status-flag {
            font-size: 18px;
            line-height: 1;
        }
        .test-status--passed {
            background: rgba(34,197,94,0.18);
            color: #15803d;
        }
        .test-status--failed {
            background: rgba(239,68,68,0.18);
            color: #b91c1c;
        }
        .test-status--skipped {
            background: rgba(251,191,36,0.22);
            color: #92400e;
        }
        .test-status--unknown {
            background: rgba(148,163,184,0.3);
            color: #334155;
        }
        .retry-grid {
            margin-top: 24px;
            display: grid;
            gap: 20px;
        }
        .retry-grid.multi {
            grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        }
        .retry-grid.single {
            grid-template-columns: 1fr;
        }
        .retry-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
            border-left: 6px solid transparent;
        }
        .retry-card--passed {
            border-left-color: #22c55e;
        }
        .retry-card--failed {
            border-left-color: #ef4444;
        }
        .retry-card--unknown {
            border-left-color: #94a3b8;
        }
        .retry-meta {
            font-size: 16px;
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .retry-meta__line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .retry-status-chip {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 600;
        }
        .retry-status-chip--passed {
            background: rgba(34,197,94,0.15);
            color: #15803d;
        }
        .retry-status-chip--failed {
            background: rgba(239,68,68,0.18);
            color: #b91c1c;
        }
        .retry-status-chip--unknown {
            background: rgba(148,163,184,0.25);
            color: #334155;
        }
        .retry-label {
            font-size: 16px;
            color: var(--text-primary);
        }
        .retry-meta .commands-graph-label {
            margin-top: 6px;
            text-align: center;
            font-size: 11px;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #0f172a;
            font-weight: bold;
        }
        .command-graph-wrapper {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            margin-bottom: 0;
            position: relative;
            height: 720px;
            overflow: hidden;
        }
        .command-graph-wrapper .command-graph {
            position: absolute;
            inset: 0;
        }
        .dot-label-layer {
            position:absolute;
            inset:0;
            pointer-events:none;
            font: 11px monospace;
            color: var(--text-primary);
        }
        .dot-label-layer span {
            position:absolute;
            white-space:nowrap;
            transform: translateY(-50%);
        }
        .command-tooltip {
            position: absolute;
            display: none;
            max-width: 360px;
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(15,23,42,0.98);
            color: #fff;
            font-size: 12px;
            line-height: 1.5;
            pointer-events: crosshair;
            box-shadow: 0 16px 40px rgba(15,23,42,0.4);
            z-index: 5;
        }
        .command-tooltip strong {
            display: inline-block;
            min-width: 90px;
            font-weight: 600;
        }
        .empty-state {
            padding: 20px;
            background: #f1f5f9;
            border: 1px dashed #cbd5f5;
            border-radius: 16px;
            color: var(--text-muted);
            margin-top: 20px;
            text-align: center;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css" rel="stylesheet"/>
</head>
<body>
    <div class="page">
        ${suiteInfoHtml}
        ${allTestsHtml}
    </div>
</body>
</html>
    `;
}



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

    const orderIndexById = {};
    (() => {
        const visited = new Set();
        let orderCounter = 0;
        const walkChain = (startId) => {
            let currentId = startId;
            while (currentId && !visited.has(currentId) && commands[currentId]) {
                visited.add(currentId);
                orderIndexById[currentId] = orderCounter++;
                const nextId = commands[currentId]?.nextCommandId;
                if (!nextId || visited.has(nextId)) break;
                currentId = nextId;
            }
        };

        const headCandidates = queueOrderedIds.filter(id => !commands[id]?.prevCommandId);
        const traversalOrder = headCandidates.length ? headCandidates : [queueOrderedIds[0]];
        traversalOrder.forEach(walkChain);
        queueOrderedIds.forEach(id => {
            if (!visited.has(id)) walkChain(id);
        });
    })();

    const durations = queueOrderedIds
        .map(id => getDuration(commands[id]))
        .filter(value => Number.isFinite(value) && value > 0);

    const maxDuration = durations.length ? Math.max(...durations) : 0;

    const minBoxWidth = 140;
    const maxBoxWidth = 280;
    // const minBoxHeight = 50;
    // const maxBoxHeight = 350;
    const verticalSpacing = 80;
    const nodeBaseY = 40; // keep queue on a visible baseline
    const identNestedLevel = 230;

    const getNestedLevel = (cmd) => {
        if (!cmd) return 0;
        if (typeof cmd.nestedLevel === 'number') {
            return Number.isFinite(cmd.nestedLevel) ? cmd.nestedLevel : 0;
        }
        const parsed = Number(cmd.nestedLevel);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const tooltipByNode = {};
    const dotLabels = {};

    const nodes = queueOrderedIds.map(id => {
        const cmd = commands[id];
        const queueIndex = queueIndexById[id];
        const duration = getDuration(cmd);
        const hasDuration = duration > 0;
        const isAssertion = cmd?.type === 'assertion';
        const shouldRenderAsBox = hasDuration || !isAssertion;
        const nestedLevel = getNestedLevel(cmd);
        const labelParts = [`${cmd.name + '()' || 'command'}`];
        // const argsPreview = formatArgs(cmd.args);
        const argsPreview = '()'
        // if (argsPreview) labelParts.push(argsPreview);
        if (hasDuration) labelParts.push(`${Math.round(duration)} ms`);

        const isSkippedAssertion = cmd?.type === 'assertion' && cmd?.state === 'skipped';
        const nodeStateKey = isSkippedAssertion ? 'passed' : cmd.state;
        let nodeColor = colorByState[nodeStateKey] || '#546e7a';
        const isNonTestRunnable = cmd?.runnableType && cmd.runnableType !== 'test';
        if (isNonTestRunnable) {
            nodeColor = emphasizeColor(nodeColor, 0.6);
        }

        const width = hasDuration
            ? Math.max(
                minBoxWidth,
                maxDuration ? (duration / maxDuration) * maxBoxWidth : minBoxWidth
            )
            : minBoxWidth;

        const nodeX = nestedLevel * identNestedLevel;
        const orderIndex = orderIndexById[id] ?? queueIndex;
        const nodeY = nodeBaseY + orderIndex * verticalSpacing;
        const tooltipHtml = buildTooltip(cmd, duration);
        const nodeFontColor = isNonTestRunnable ? '#0b1220' : '#fff';
        const nodeFontSize = shouldRenderAsBox ? 18 : 11;
        const node = {
            id,
            label: labelParts.join('\n'),
            x: nodeX,
            y: nodeY,
            fixed: true,
            color: { background: nodeColor, border: '#263238', highlight: { background: nodeColor, border: '#000' } },
            font: { face: 'monospace', align: 'left', multi: 'md', color: nodeFontColor, size: nodeFontSize },
            tooltip: tooltipHtml
        };
        tooltipByNode[id] = tooltipHtml;

        if (shouldRenderAsBox) {
            node.shape = 'box';
            node.widthConstraint = { minimum: width, maximum: width };
            node.font.align = 'center';
        } else {
            node.shape = 'dot';
            node.size = 14;
            node.label = '';
            node.font = { face: 'monospace', color: '#263238', align: 'left' };
            dotLabels[id] = labelParts.join(' ');
        }

        return node;
    });

    const edges = [];
    const queueEdgeKeys = new Set();

    // Actual execution flow (nextCommandId)
    queueOrderedIds.forEach(id => {
        const cmd = commands[id];
        if (cmd.nextCommandId && commands[cmd.nextCommandId]) {
            const fromLevel = getNestedLevel(cmd);
            const toLevel = getNestedLevel(commands[cmd.nextCommandId]);
            const roundness = toLevel > fromLevel ? 0.3 : toLevel < fromLevel ? 0.05 : 0.15;
            edges.push({
                from: id,
                to: cmd.nextCommandId,
                arrows: 'to',
                color: '#1976d2',
                width: 2,
                smooth: {
                    type: 'cubicBezier',
                    roundness
                }
            });
        }
        const prevQueuedId = cmd.prevQueuedCommandId;
        if (prevQueuedId && commands[prevQueuedId]) {
            const prevLevel = getNestedLevel(commands[prevQueuedId]);
            const currentLevel = getNestedLevel(cmd);
            if (prevLevel === currentLevel) {
                const key = prevQueuedId + '->' + id;
                if (!queueEdgeKeys.has(key)) {
                    queueEdgeKeys.add(key);
                    edges.push({
                        from: prevQueuedId,
                        to: id,
                        arrows: 'to',
                        color: '#90a4ae',
                        dashes: true,
                        width: 1.5,
                        smooth: {
                            type: 'cubicBezier',
                            roundness: 0.15
                        }
                    });
                }
            }
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
                        improvedLayout: false,
                        hierarchical: false
                    },
                    interaction: {
                        dragNodes: false,
                        hover: false,
                        dragView: true,
                        zoomView: true
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
            cmd?.runnableType ? `<div><strong>Runnable type:</strong> ${esc(cmd.runnableType)}</div>` : '',
            `<div><strong>Queue order:</strong> ${esc(cmd.queueInsertionOrder ?? '-')}</div>`,
            `<div><strong>Execution order:</strong> ${esc(cmd.executionOrder ?? '-')}</div>`,
            `<div><strong>Duration:</strong> ${esc(duration > 0 ? Math.round(duration) + ' ms' : 'n/a')}</div>`
        ];
        return info.filter(Boolean).join('');
    }
}


export default {
    createSuiteAuditHtmlReport,
}

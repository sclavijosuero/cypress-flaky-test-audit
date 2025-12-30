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

const asFiniteNumber = (value) => (typeof value === 'number' && Number.isFinite(value)) ? value : null;

const getCommandDurationMs = (cmd) => {
    if (!cmd) return 0;
    const perfDuration = asFiniteNumber(cmd.durationPerformance);
    if (perfDuration !== null && perfDuration >= 0) return perfDuration;
    const duration = asFiniteNumber(cmd.duration);
    return duration !== null && duration >= 0 ? duration : 0;
};

const collectCommandEntries = (resultsGraph) => {
    if (!resultsGraph) return [];
    if (resultsGraph instanceof Map) {
        return Array.from(resultsGraph.values());
    }
    if (typeof resultsGraph === 'object') {
        return Object.values(resultsGraph);
    }
    return [];
};

const trimToDecimals = (value, decimals = 3) => {
    if (!Number.isFinite(value)) return null;
    const fixed = value.toFixed(decimals);
    return fixed.replace(/\.?0+$/, '');
};

const normalizeState = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).toLowerCase();
};

const hookRunnableNames = new Set(['before each', 'after each', 'before', 'after']);

const formatHookLabel = (cmd) => {
    if (!cmd) return 'Hook';
    const base = (cmd.runnableType || 'hook').toString();
    const hookId = cmd.hookId;
    if (hookId) {
        return `${base} (${hookId})`;
    }
    return base;
};

const getRunnableGrouping = (cmd) => {
    if (!cmd) {
        return { kind: 'unknown', key: 'unknown', label: 'Unknown' };
    }
    const runnableType = (cmd.runnableType || '').toString();
    const normalizedType = runnableType.toLowerCase();
    const hookId = cmd.hookId;
    const isHook = Boolean(hookId) || hookRunnableNames.has(normalizedType);
    if (isHook) {
        const key = hookId ? `hook:${hookId}` : `hook:${normalizedType || 'unknown'}`;
        return { kind: 'hook', key, label: formatHookLabel(cmd) };
    }
    if (normalizedType === 'test') {
        return { kind: 'test', key: 'test', label: 'Test' };
    }
    const key = normalizedType || 'other';
    const label = runnableType || 'Other';
    return { kind: 'other', key, label };
};

const shouldSeparateGroups = (prevGroup, nextGroup) => {
    if (!prevGroup || !nextGroup) return false;
    if (prevGroup.kind === 'hook' && nextGroup.kind === 'hook') {
        return prevGroup.key !== nextGroup.key;
    }
    const isPrevHook = prevGroup.kind === 'hook';
    const isNextHook = nextGroup.kind === 'hook';
    const isPrevTest = prevGroup.kind === 'test';
    const isNextTest = nextGroup.kind === 'test';
    if ((isPrevHook && isNextTest) || (isPrevTest && isNextHook)) {
        return true;
    }
    return false;
};

const buildSeparatorLabel = (prevGroup, nextGroup) => {
    const left = prevGroup?.label || 'Previous';
    const right = nextGroup?.label || 'Next';
    if (left === right) return left;
    return `${left} → ${right}`;
};

const formatPreciseMilliseconds = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return 'n/a';
    if (ms < 1000) return `${trimToDecimals(ms)} ms`;
    return `${trimToDecimals(ms / 1000)} s`;
};

const getRetryDurationMs = (retryInfo) => {
    if (!retryInfo) return 0;
    const explicitDuration = asFiniteNumber(retryInfo.testDuration);
    if (explicitDuration !== null && explicitDuration >= 0) {
        return explicitDuration;
    }

    const commands = collectCommandEntries(retryInfo.resultsGraph);
    if (!commands.length) return 0;

    const startCandidates = commands
        .map(cmd => asFiniteNumber(cmd.startTime) ?? asFiniteNumber(cmd.enqueuedTime))
        .filter(value => value !== null);
    const endCandidates = commands
        .map(cmd => {
            const endTime = asFiniteNumber(cmd.endTime);
            if (endTime !== null) return endTime;
            const retryTime = asFiniteNumber(cmd.retryTime);
            if (retryTime !== null) return retryTime;
            return asFiniteNumber(cmd.startTime) ?? asFiniteNumber(cmd.enqueuedTime);
        })
        .filter(value => value !== null);

    const fallbackStart = asFiniteNumber(retryInfo.testStartTime);
    const minStart = startCandidates.length ? Math.min(...startCandidates) : fallbackStart;
    const maxEnd = endCandidates.length ? Math.max(...endCandidates) : null;

    if (minStart !== null && maxEnd !== null && maxEnd >= minStart) {
        return maxEnd - minStart;
    }

    const durationFromCommands = commands.reduce((total, cmd) => total + getCommandDurationMs(cmd), 0);
    return durationFromCommands > 0 ? durationFromCommands : 0;
};

const getTestDurationMs = (testData) => {
    if (!testData || !Array.isArray(testData.retriesInfo)) return 0;
    return testData.retriesInfo.reduce((total, retryInfo) => {
        if (!retryInfo) return total;
        const duration = getRetryDurationMs(retryInfo);
        return total + (Number.isFinite(duration) ? duration : 0);
    }, 0);
};

const getSuiteDurationMs = (resultsMap) => {
    if (!resultsMap || typeof resultsMap.forEach !== 'function') return 0;
    let total = 0;
    resultsMap.forEach(testData => {
        total += getTestDurationMs(testData);
    });
    return total;
};

const formatDuration = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return 'n/a';
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) {
        return `${trimToDecimals(totalSeconds)} s`;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds - hours * 3600 - minutes * 60;

    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (hours || minutes) parts.push(`${minutes}m`);
    parts.push(`${trimToDecimals(seconds)}s`);

    return parts.join(' ');
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
    const testAuditFolder = Cypress.config('testAuditFolder') || 'cypress/reports/flaky-test-audit/';
    cy.writeFile(
        testAuditFolder +
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
    const suiteDurationMs = getSuiteDurationMs(testAuditResults);
    const suiteDurationDisplay = formatDuration(suiteDurationMs);

    const failedTestsCount = Array.from(testAuditResults.values()).filter(test => (test?.testStatus || '').toLowerCase() === 'failed').length;

    // Compose HTML for suite audit report
    let suiteInfoHtml = `
        <section class="suite-overview">
            <div class="suite-heading">
                <p class="eyebrow">Flaky Test Audit</p>
                <h1>${esc(spec.fileName)}</h1>
            </div>
            <div class="suite-stats">
                <div class="suite-stats__row suite-stats__row--primary">
                    <article class="stat-card stat-card--generated">
                        <span class="stat-label">Generated</span>
                        <span class="stat-value">${esc(generatedAt)}</span>
                    </article>
                    <article class="stat-card stat-card--spec">
                        <span class="stat-label">Spec Path</span>
                        <span class="stat-value stat-value--small">${esc(spec.relative)}</span>
                    </article>
                </div>
                <div class="suite-stats__row suite-stats__row--secondary">
                    <article class="stat-card stat-card--duration">
                        <span class="stat-label">Suite Duration</span>
                        <span class="stat-value">${esc(suiteDurationDisplay)}</span>
                    </article>
                    <article class="stat-card stat-card--total">
                        <span class="stat-label">Total Tests</span>
                        <span class="stat-value">${testAuditResults.size}</span>
                    </article>
                    <article class="stat-card stat-card--failed ${failedTestsCount === 0 ? 'stat-card--failed-zero' : ''}">
                        <span class="stat-label">Failed Tests</span>
                        <span class="stat-value">${failedTestsCount}</span>
                    </article>
                </div>
            </div>
        </section>
    `;
    let allTestsHtml = "";

    // testAuditResults: Map of testId (string) => {testTitle, maxRetries, retriesInfo}
    let testIdx = 0;
    for (const [testId, testData] of testAuditResults.entries()) {
        const statusDisplay = getTestStatusDisplay(testData.testStatus);
        const testDurationMs = getTestDurationMs(testData);
        const testDurationDisplay = formatDuration(testDurationMs);
        let testHtml = `
        <section class="test-card">
            <header class="test-card__header">
                <div class="test-card__title-block">
                    <p class="eyebrow eyebrow--dark">Test</p>
                    <h2>${esc(testData.testTitle)}</h2>
                </div>
                <div class="test-card__summary">
                    <div class="test-card__summary-label">Summary</div>
                    <div class="test-card__quick-stats">
                        <div class="quick-stat quick-stat--duration">
                            <span class="quick-stat__icon" aria-hidden="true">⏱</span>
                            <div class="quick-stat__text">
                                <span class="quick-stat__label">Total Duration</span>
                                <span class="quick-stat__value">${esc(testDurationDisplay)}</span>
                            </div>
                        </div>
                        <div class="quick-stat quick-stat--status ${statusDisplay.className}">
                            <span class="quick-stat__icon" aria-hidden="true">${statusDisplay.flag}</span>
                            <div class="quick-stat__text">
                                <span class="quick-stat__label">Status</span>
                                <span class="quick-stat__value">${statusDisplay.label}</span>
                            </div>
                        </div>
                    </div>
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
                const retryStatusText = retryStatus ? retryStatus.charAt(0).toUpperCase() + retryStatus.slice(1) : 'Unknown';
                const startTimeDisplay = retry?.testStartTime ? new Date(retry.testStartTime).toLocaleString() : 'n/a';
                const retryDurationMs = getRetryDurationMs(retry);
                const retryDurationDisplay = formatDuration(retryDurationMs);
                return `
                    <div class="${cardClass}">
                        <div class="retry-meta">
                            <div class="retry-meta__line retry-meta__line--status">
                                <div class="${chipClass}" aria-label="${esc(retryStatusText)}">${statusIcon}</div>
                                <div class="retry-label">
                                    <b class="retry-count">${esc(retryLabel)}</b>
                                    <span class="retry-status-text">${esc(retryStatusText)}</span>
                                </div>
                            </div>
                            <div class="retry-meta__line retry-meta__line--time">
                                <div><b>Start time:</b> ${esc(startTimeDisplay)}</div>
                                <div class="retry-duration"><b>Duration:</b> ${esc(retryDurationDisplay)}</div>
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
            max-width: 1500px;
            margin: 0 auto;
            padding: 24px clamp(16px, 4vw, 32px) 28px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .suite-overview {
            border-radius: 16px;
            padding: 16px 18px 18px;
            background: linear-gradient(135deg, rgba(59,130,246,0.92), rgba(14,165,233,0.82));
            color: #fff;
            box-shadow: 0 12px 32px rgba(15,23,42,0.2);
        }
        .suite-heading {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }
        .suite-heading h1 {
            margin: 2px 0 0;
            font-size: 22px;
            letter-spacing: -0.01em;
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
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .suite-stats__row {
            display: grid;
            gap: 12px;
        }
        .suite-stats__row--primary {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }
        .suite-stats__row--secondary {
            grid-template-columns: repeat(3, minmax(150px, 1fr));
        }
        .stat-card {
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 14px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .stat-card:hover, .stat-card:focus-within {
            transform: translateY(-3px);
            box-shadow: 0 14px 30px rgba(15,23,42,0.25);
        }
        .stat-card--total {
            border-color: rgba(255,255,255,0.45);
        }
        .stat-card--failed {
            background: linear-gradient(145deg, rgba(239,68,68,0.25), rgba(239,68,68,0.55));
            border-color: rgba(239,68,68,0.9);
            box-shadow: 0 14px 32px rgba(239,68,68,0.45), inset 0 0 0 1px rgba(255,255,255,0.2);
        }
        .stat-card--failed .stat-label {
            color: rgba(255,255,255,0.85);
        }
        .stat-card--failed .stat-value {
            font-size: 26px;
        }
        .stat-card--failed-zero {
            background: linear-gradient(145deg, rgba(34,197,94,0.25), rgba(34,197,94,0.55));
            border-color: rgba(34,197,94,0.9);
            box-shadow: 0 14px 28px rgba(34,197,94,0.4), inset 0 0 0 1px rgba(255,255,255,0.25);
        }
        .stat-card--failed-zero .stat-label {
            color: rgba(255,255,255,0.9);
        }
        .stat-card--failed-zero .stat-value {
            color: #f0fff4;
        }
        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: rgba(255,255,255,0.75);
        }
        .stat-value {
            font-size: 21px;
            font-weight: 600;
            color: #fff;
        }
        .stat-value--small {
            font-size: 15px;
            word-break: break-all;
        }
        .test-card {
            background: #fff;
            border-radius: 16px;
            padding: 16px 18px 18px;
            box-shadow: var(--card-shadow);
            color: var(--text-primary);
        }
        .test-card__header {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .test-card__title-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .test-card__title-block h2 {
            margin: 0;
            font-size: clamp(18px, 2vw, 21px);
            line-height: 1.35;
            letter-spacing: -0.01em;
            word-break: break-word;
            overflow-wrap: anywhere;
        }
        .test-card__summary {
            background: linear-gradient(120deg, rgba(148,163,184,0.12), rgba(148,163,184,0.2));
            border: 1px solid rgba(148,163,184,0.35);
            border-radius: 14px;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .test-card__summary-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4em;
            color: #0f172a;
            font-weight: 700;
        }
        .test-card__quick-stats {
            display: flex;
            gap: 10px;
            flex-wrap: nowrap;
        }
        .quick-stat {
            background: #f6f8fb;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1 1 0;
            min-width: 0;
            transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .quick-stat:hover,
        .quick-stat:focus-within {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(15,23,42,0.15);
        }
        .quick-stat__icon {
            width: 30px;
            height: 30px;
            border-radius: 10px;
            background: #e2e8f0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
        }
        .quick-stat__text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .quick-stat__label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.25em;
            color: var(--text-muted);
        }
        .quick-stat__value {
            font-size: 17px;
            font-weight: 600;
            color: var(--text-primary);
            word-break: break-word;
        }
        .quick-stat--duration .quick-stat__icon {
            background: rgba(14,165,233,0.18);
            color: #075985;
        }
        .quick-stat--status .quick-stat__label {
            letter-spacing: 0.18em;
        }
        .quick-stat--status.test-status--passed {
            background: rgba(34,197,94,0.12);
            border-color: rgba(34,197,94,0.35);
        }
        .quick-stat--status.test-status--passed .quick-stat__value {
            color: #15803d;
        }
        .quick-stat--status.test-status--passed .quick-stat__icon {
            background: rgba(34,197,94,0.25);
            color: #14532d;
        }
        .quick-stat--status.test-status--failed {
            background: rgba(239,68,68,0.12);
            border-color: rgba(239,68,68,0.35);
        }
        .quick-stat--status.test-status--failed .quick-stat__value {
            color: #b91c1c;
        }
        .quick-stat--status.test-status--failed .quick-stat__icon {
            background: rgba(239,68,68,0.25);
            color: #7f1d1d;
        }
        .quick-stat--status.test-status--skipped {
            background: rgba(251,191,36,0.18);
            border-color: rgba(251,191,36,0.4);
        }
        .quick-stat--status.test-status--unknown {
            background: rgba(148,163,184,0.25);
            border-color: rgba(148,163,184,0.4);
        }
        .retry-grid {
            margin-top: 18px;
            display: grid;
            gap: 16px;
        }
        .retry-grid.multi {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }
        .retry-grid.single {
            grid-template-columns: 1fr;
        }
        .retry-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
            border-left: 4px solid transparent;
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
            font-size: 14px;
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .retry-meta__line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
        }
        .retry-meta__line--status {
            justify-content: flex-start;
            gap: 10px;
        }
        .retry-meta__line--time {
            flex-wrap: wrap;
            gap: 8px;
        }
        .retry-meta__line--time > div {
            flex: 1;
            min-width: 140px;
        }
        .retry-status-chip {
            width: 30px;
            height: 30px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
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
            font-size: 15px;
            color: var(--text-primary);
            display: inline-flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
        }
        .retry-count {
            font-weight: 600;
        }
        .retry-status-text {
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 600;
        }
        .retry-duration {
            text-align: right;
        }
        .retry-meta .commands-graph-label {
            margin: 4px 0 2px;
            padding: 5px 12px;
            text-align: center;
            font-size: 11px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #0f172a;
            font-weight: 700;
            background: linear-gradient(120deg, #e2e8f0, #f8fafc);
            border: 1px solid #cbd5f5;
            border-radius: 10px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 16px rgba(15,23,42,0.12);
            align-self: stretch;
        }
        .command-graph-block {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .graph-toggle {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px;
            width: fit-content;
            border-radius: 12px;
            background: linear-gradient(135deg, #f8fafc, #eef2ff);
            border: 1px solid #dbe4ff;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 16px rgba(15,23,42,0.12);
        }
        .graph-toggle__btn {
            border: none;
            background: transparent;
            color: #1f2937;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            font-size: 11px;
            padding: 8px 12px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .graph-toggle__btn:hover {
            background: rgba(148, 163, 184, 0.18);
        }
        .graph-toggle__btn.is-active {
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
            color: #fff;
            box-shadow: 0 8px 18px rgba(14,165,233,0.32);
            border: 1px solid rgba(14,165,233,0.45);
        }
        .command-graph-wrapper {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            margin-bottom: 0;
            position: relative;
            height: 772.8px;
            overflow: hidden;
        }
        @media (max-width: 1024px) {
            .command-graph-wrapper {
                height: 662.4px;
            }
        }
        @media (max-width: 640px) {
            .page {
                padding: 18px 16px 24px;
            }
            .suite-overview {
                padding: 14px 14px 16px;
            }
            .suite-heading {
                flex-direction: column;
            }
            .suite-stats__row--primary {
                grid-template-columns: minmax(0, 1fr);
            }
            .suite-stats__row--secondary {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .test-card {
                padding: 16px 18px;
            }
            .test-card__summary {
                padding: 10px 12px;
            }
            .quick-stat {
                padding: 6px 10px;
            }
            .quick-stat__icon {
                width: 26px;
                height: 26px;
                font-size: 13px;
            }
            .quick-stat__value {
                font-size: 16px;
            }
            .retry-duration {
                text-align: left;
            }
            .retry-meta__line--time > div {
                flex-basis: 100%;
                text-align: left;
            }
            .command-graph-wrapper {
                height: 579.6px;
            }
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
         .graph-separator-layer {
             position: absolute;
             inset: 0;
             pointer-events: none;
             font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
             color: #94a3b8;
             font-size: 11px;
         }
         .graph-separator-layer__line {
             position: absolute;
             left: 0;
             right: 0;
             border-top: 1px dashed rgba(15, 23, 42, 0.25);
         }
         .graph-separator-layer__label {
             position: absolute;
             left: 12px;
             padding: 2px 8px;
             border-radius: 999px;
             background: rgba(15,23,42,0.85);
             color: #cbd5f5;
             text-transform: uppercase;
             letter-spacing: 0.12em;
             font-size: 10px;
             transform: translateY(-90%);
             box-shadow: 0 4px 12px rgba(15,23,42,0.25);
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

    const commandSlownessThreshold = (() => {
        try {
            if (typeof Cypress !== 'undefined' && Cypress?.env) {
                const value = Cypress.env('commandSlownessThreshold');
                return typeof value === 'number' && Number.isFinite(value) ? value : 1500;
            }
        } catch (e) {
            // ignore - fall back to default
        }
        return 1500;
    })();

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
        .map(id => getCommandDurationMs(commands[id]))
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

    const buildGraphData = (mode = 'execution') => {
        const dotLabels = {};
        const isQueueMode = mode === 'queue';
        const orderingMap = isQueueMode ? queueIndexById : orderIndexById;
        const nodeYById = {};
        const nodes = queueOrderedIds.map(id => {
            const cmd = commands[id];
            const queueIndex = queueIndexById[id];
            const duration = getCommandDurationMs(cmd);
            const hasDuration = duration > 0;
            const isAssertion = cmd?.type === 'assertion';
            const shouldRenderAsBox = hasDuration || !isAssertion;
            const nestedLevel = getNestedLevel(cmd);
            const labelParts = [`${cmd.name + '()' || 'command'}`];
            // const argsPreview = formatArgs(cmd.args);
            const argsPreview = '()'
            // if (argsPreview) labelParts.push(argsPreview);
            if (hasDuration) {
                const durationLabel = formatPreciseMilliseconds(duration);
                if (durationLabel !== 'n/a') labelParts.push(durationLabel);
            }

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
            const orderIndex = orderingMap[id] ?? queueIndex ?? 0;
            const nodeY = nodeBaseY + orderIndex * verticalSpacing;
            nodeYById[id] = nodeY;
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
            if (!tooltipByNode[id]) {
                tooltipByNode[id] = tooltipHtml;
            }

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

        const getCommandState = (cmd) => normalizeState(cmd?.state);
        const shouldHighlightExecutionEdge = (fromCmd, toCmd) => {
            if (!fromCmd || !toCmd) return false;
            const fromState = getCommandState(fromCmd);
            const toState = getCommandState(toCmd);
            const fromFailed = fromState === 'failed';
            const toFailed = toState === 'failed';
            const fromQueued = fromState === 'queued';
            const toQueued = toState === 'queued';
            return (fromFailed && toFailed)
                || (fromFailed && toQueued)
                || (fromQueued && toQueued);
        };
        
        const executionEdgeBaseColor = '#181a1b'; // darker light black
        const queuedEdgeBaseColor = '#181a1b';
        const executionEdgeHighlightColor = colorByState.failed || '#c62828';
        const createEdgeColor = (colorHex) => ({ color: colorHex, highlight: colorHex });
        const edges = [];
        const queueEdgeKeys = new Set();

        if (isQueueMode) {
            for (let i = 0; i < queueOrderedIds.length - 1; i++) {
                const fromId = queueOrderedIds[i];
                const toId = queueOrderedIds[i + 1];
                if (commands[fromId] && commands[toId]) {
                    edges.push({
                        from: fromId,
                        to: toId,
                        arrows: 'to',
                        color: createEdgeColor(queuedEdgeBaseColor),
                        width: 2,
                        dashes: true,
                        smooth: false,
                        // smooth: {
                        //     type: 'cubicBezier',
                        //     roundness: 0.12
                        // }
                    });
                }
            }
        } else {
            const queuedEdges = [];
            const executionEdges = [];
            queueOrderedIds.forEach(id => {
                const cmd = commands[id];
                const nextCmd = cmd.nextCommandId ? commands[cmd.nextCommandId] : null;
                const fromLevel = getNestedLevel(cmd);
                const toLevel = getNestedLevel(nextCmd);
                const roundness = toLevel > fromLevel ? 0.3 : toLevel < fromLevel ? 0.05 : 0.15;
                const prevQueuedId = cmd.prevQueuedCommandId;

                if (prevQueuedId && commands[prevQueuedId]) {
                    const prevLevel = getNestedLevel(commands[prevQueuedId]);
                    const currentLevel = getNestedLevel(cmd);
                    if (prevLevel === currentLevel) {
                        const key = prevQueuedId + '->' + id;
                        if (!queueEdgeKeys.has(key)) {
                            queueEdgeKeys.add(key);
                            queuedEdges.push({
                                from: prevQueuedId,
                                to: id,
                                arrows: 'to',
                                color: createEdgeColor(queuedEdgeBaseColor),
                                dashes: true,
                                width: 1,
                                smooth: false,
                                // smooth: {
                                //     type: 'cubicBezier',
                                //     roundness
                                // }
                            });
                        }
                    }
                }

                if (nextCmd) {
                    const highlightEdge = shouldHighlightExecutionEdge(cmd, nextCmd);
                    const edgeColor = highlightEdge ? executionEdgeHighlightColor : executionEdgeBaseColor;
                    executionEdges.push({
                        from: id,
                        to: cmd.nextCommandId,
                        arrows: 'to',
                        color: createEdgeColor(edgeColor),
                        width: highlightEdge ? 3 : 2,
                        smooth: false,
                        // smooth: {
                        //     type: 'cubicBezier',
                        //     roundness
                        // }
                    });
                }
            });
            queuedEdges.forEach(edge => edges.push(edge));
            executionEdges.forEach(edge => edges.push(edge));
        }

        const separators = (() => {
            const orderedIds = queueOrderedIds
                .slice()
                .sort((a, b) => {
                    const orderA = orderingMap[a] ?? queueIndexById[a] ?? 0;
                    const orderB = orderingMap[b] ?? queueIndexById[b] ?? 0;
                    return orderA - orderB;
                });
            const result = [];
            let prevId = null;
            let prevGroup = null;
            orderedIds.forEach(id => {
                const currentCmd = commands[id];
                const currentGroup = getRunnableGrouping(currentCmd);
                if (prevId && shouldSeparateGroups(prevGroup, currentGroup)) {
                    const prevY = nodeYById[prevId];
                    const currentY = nodeYById[id];
                    if (Number.isFinite(prevY) && Number.isFinite(currentY)) {
                        result.push({
                            y: prevY + (currentY - prevY) / 2,
                            from: prevGroup,
                            to: currentGroup,
                            label: buildSeparatorLabel(prevGroup, currentGroup)
                        });
                    }
                }
                prevId = id;
                prevGroup = currentGroup;
            });
            return result;
        })();

        return { nodes, edges, dotLabels, separators };
    };

    const executionGraph = buildGraphData('execution');
    const queueGraph = buildGraphData('queue');
    const wrapperId = `${graphContainerId}_wrapper`;
    const tooltipId = `${graphContainerId}_tooltip`;
    const labelsId = `${graphContainerId}_labels`;
    const separatorsId = `${graphContainerId}_separators`;
    const toggleId = `${graphContainerId}_mode`;

    return `
            <div class="command-graph-block">
                <div id="${esc(toggleId)}" class="graph-toggle" role="group" aria-label="Graph path view">
                    <button type="button" class="graph-toggle__btn is-active" data-mode="execution">Execution path</button>
                    <button type="button" class="graph-toggle__btn" data-mode="queue">Queue path</button>
                </div>
                <div id="${esc(wrapperId)}" class="command-graph-wrapper">
                    <div id="${esc(graphContainerId)}" class="command-graph"></div>
                    <div id="${esc(separatorsId)}" class="graph-separator-layer" aria-hidden="true"></div>
                    <div id="${esc(labelsId)}" class="dot-label-layer" aria-hidden="true"></div>
                    <div id="${esc(tooltipId)}" class="command-tooltip" role="tooltip" aria-hidden="true"></div>
                </div>
            </div>
            <script>
            (function() {
                var datasets = {
                    execution: {
                        nodes: new vis.DataSet(${JSON.stringify(executionGraph.nodes)}),
                        edges: new vis.DataSet(${JSON.stringify(executionGraph.edges)}),
                        dotLabels: ${JSON.stringify(executionGraph.dotLabels)},
                        separators: ${JSON.stringify(executionGraph.separators)}
                    },
                    queue: {
                        nodes: new vis.DataSet(${JSON.stringify(queueGraph.nodes)}),
                        edges: new vis.DataSet(${JSON.stringify(queueGraph.edges)}),
                        dotLabels: ${JSON.stringify(queueGraph.dotLabels)},
                        separators: ${JSON.stringify(queueGraph.separators)}
                    }
                };
                var separatorsByMode = {
                    execution: datasets.execution.separators || [],
                    queue: datasets.queue.separators || []
                };
                var nodeTooltips = ${JSON.stringify(tooltipByNode)};
                var container = document.getElementById("${esc(graphContainerId)}");
                var tooltip = document.getElementById("${esc(tooltipId)}");
                var labelLayer = document.getElementById("${esc(labelsId)}");
                var separatorLayer = document.getElementById("${esc(separatorsId)}");
                var currentMode = 'execution';
                var dotLabels = datasets[currentMode].dotLabels;
                var dotLabelIds = Object.keys(dotLabels);
                var data = { nodes: datasets[currentMode].nodes, edges: datasets[currentMode].edges };
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
                        smooth: false,
                        selectionWidth: 0
                    }
                };
                var network = new vis.Network(container, data, options);
                network.once('afterDrawing', function () {
                    network.fit({ animation: false });
                    renderOverlays();
                });
                network.on('afterDrawing', renderOverlays);
                network.on('zoom', renderOverlays);
                network.on('dragEnd', renderOverlays);

                function hideTooltip() {
                    if (!tooltip) return;
                    tooltip.style.display = 'none';
                    tooltip.setAttribute('aria-hidden', 'true');
                }

                function renderDotLabels() {
                    if (!labelLayer) return;
                    labelLayer.innerHTML = "";
                    if (!dotLabelIds.length) return;
                    var positions = network.getPositions(dotLabelIds);
                    var scale = typeof network.getScale === 'function' ? network.getScale() : 1;
                    var effectiveScale = Math.min(Math.max(scale, 0.55), 2.4);
                    var baseFontSize = 18;
                    var fontSize = baseFontSize * effectiveScale;
                    var nodeDataSet = datasets[currentMode] && datasets[currentMode].nodes;
                    dotLabelIds.forEach(function(id) {
                        var pos = positions[id];
                        if (!pos) return;
                        var domPos = network.canvasToDOM(pos);
                        var labelEl = document.createElement('span');
                        labelEl.textContent = dotLabels[id];
                        labelEl.style.fontSize = fontSize + 'px';
                        var nodeData = nodeDataSet ? nodeDataSet.get(id) : null;
                        var nodeSize = (nodeData && typeof nodeData.size === 'number') ? nodeData.size : 14;
                        var offset = (nodeSize + 6) * effectiveScale;
                        labelEl.style.left = (domPos.x + offset) + 'px';
                        labelEl.style.top = domPos.y + 'px';
                        labelLayer.appendChild(labelEl);
                    });
                }

                function renderSeparators() {
                    if (!separatorLayer) return;
                    separatorLayer.innerHTML = "";
                    var separators = separatorsByMode[currentMode] || [];
                    if (!separators.length) return;
                    separators.forEach(function(separator) {
                        if (!separator || typeof separator.y !== 'number') return;
                        var domPos = network.canvasToDOM({ x: 0, y: separator.y });
                        var line = document.createElement('div');
                        line.className = 'graph-separator-layer__line';
                        line.style.top = domPos.y + 'px';
                        separatorLayer.appendChild(line);
                        if (separator.label) {
                            var label = document.createElement('div');
                            label.className = 'graph-separator-layer__label';
                            label.textContent = separator.label;
                            label.style.top = domPos.y + 'px';
                            separatorLayer.appendChild(label);
                        }
                    });
                }

                function renderOverlays() {
                    renderSeparators();
                    renderDotLabels();
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

                var toggleEl = document.getElementById("${esc(toggleId)}");
                function updateToggleUI(mode) {
                    if (!toggleEl) return;
                    toggleEl.querySelectorAll('[data-mode]').forEach(function(btn) {
                        var btnMode = btn.getAttribute('data-mode');
                        btn.classList.toggle('is-active', btnMode === mode);
                    });
                }
                function setMode(mode) {
                    if (!datasets[mode]) return;
                    currentMode = mode;
                    dotLabels = datasets[mode].dotLabels || {};
                    dotLabelIds = Object.keys(dotLabels);
                    network.setData({ nodes: datasets[mode].nodes, edges: datasets[mode].edges });
                    hideTooltip();
                    updateToggleUI(mode);
                    requestAnimationFrame(renderOverlays);
                }
                if (toggleEl) {
                    toggleEl.querySelectorAll('[data-mode]').forEach(function(btn) {
                        btn.addEventListener('click', function() {
                            var mode = this.getAttribute('data-mode');
                            if (!mode || mode === currentMode) return;
                            setMode(mode);
                        });
                    });
                }
            })();
            </script>
        `;

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
        // cmd is the commandInfo object with the following properties:
        // - name: the name of the command
        // - args: the arguments of the command
        // - state: the state of the command
        // - error: the error object
        // - queueInsertionOrder: the queue insertion order of the command
        // - executionOrder: the execution order of the command
        // - runnableType: the runnable type of the command
        // - hookId: the hook id of the command

        const argsText = cmd.args ? formatArgs(cmd.args) : '';
        const state = (cmd?.state || '').toString();
        const normalizedState = state.toLowerCase();
        const isSlowPassed = normalizedState === 'passed' && Number.isFinite(duration) && duration > commandSlownessThreshold;
        const stateFlag = normalizedState === 'failed'
            ? '❌'
            : normalizedState === 'queued'
                ? '⛔'
                : isSlowPassed
                    ? '⏳'
                    : normalizedState === 'passed'
                        ? '✔️'
                        : '⛔';

        const stateDisplay = normalizedState === 'queued'
            ? 'queued (never run)'
            : isSlowPassed
                ? 'passed (slow)'
                : (state || 'unknown');

        const errorObj = (cmd && typeof cmd.error === 'object' && cmd.error !== null) ? cmd.error : null;
        const codeFrame = errorObj && typeof errorObj.codeFrame === 'object' && errorObj.codeFrame !== null ? errorObj.codeFrame : null;

        let codeFrameDisplay = '';
        if (normalizedState === 'failed' && codeFrame) {
            const originalFile = codeFrame.originalFile ?? codeFrame.relativeFile ?? codeFrame.file ?? codeFrame.absoluteFile ?? '';
            const line = codeFrame.line;
            const column = codeFrame.column;
            const lineText = (typeof line === 'number' && Number.isFinite(line)) ? String(line) : '-';
            const columnText = (typeof column === 'number' && Number.isFinite(column)) ? String(column) : '-';
            const fileText = originalFile ? String(originalFile) : '-';
            codeFrameDisplay = `${fileText}:${lineText}:${columnText}`;
        }

        const messageDisplay = (normalizedState === 'failed' && errorObj && typeof errorObj.message === 'string' && errorObj.message.trim())
            ? errorObj.message.trim()
            : '';

        const info = [
            `<div><strong>Command:</strong> ${esc(cmd.name || 'command')}</div>`,
            argsText ? `<div><strong>Args:</strong> ${esc(argsText)}</div>` : '',
            `<div><strong>State:</strong> ${esc(stateFlag)} ${esc(stateDisplay)}</div>`,
            cmd?.retries ? `<div><strong>Internal retries:</strong> ${esc(cmd.retries)}</div>` : '',
            cmd?.runnableType ? `<div><strong>Runnable type:</strong> ${esc(cmd.runnableType)}</div>` : '',
            cmd?.hookId ? `<div><strong>Hook ID:</strong> ${esc(cmd.hookId)}</div>` : '',
            `<div><strong>Queue order:</strong> ${esc(cmd.queueInsertionOrder ?? '-')}</div>`,
            `<div><strong>Execution order:</strong> ${esc(cmd.executionOrder ?? '-')}</div>`,
            `<div><strong>Duration:</strong> ${esc(duration > 0 ? formatPreciseMilliseconds(duration) : 'n/a')}</div>`,
            (normalizedState === 'failed' && codeFrameDisplay) ? `<div><strong>CodeFrame:</strong> ${esc(codeFrameDisplay)}</div>` : '',
            (normalizedState === 'failed' && messageDisplay) ? `<div><strong>Message:</strong> ${esc(messageDisplay)}</div>` : ''
        ];
        return info.filter(Boolean).join('');
    }
}


export default {
    createSuiteAuditHtmlReport,
}

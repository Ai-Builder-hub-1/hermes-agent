export function buildCapacityCommandCenterSnapshot(input) {
    const totals = calculateCapacityTotals(input);
    const missingFeeds = input.missingFeeds ?? [];
    const budgetRemainingUsd = typeof input.budgetUsd === "number" && typeof input.budgetUsedUsd === "number"
        ? Math.max(0, input.budgetUsd - input.budgetUsedUsd)
        : undefined;
    return {
        id: input.id ?? "hermes-capacity-command-center",
        projectId: "hermes-technical-central-command",
        generatedAt: input.generatedAt,
        modules: buildCapacityModules(input, missingFeeds),
        metrics: [
            metric("total-tokens-in", "Tokens In", totals.tokensIn, "tokens", "capacity usage entering model/provider lanes", "watch"),
            metric("total-tokens-out", "Tokens Out", totals.tokensOut, "tokens", "capacity usage produced by model/provider lanes", "watch"),
            metric("estimated-cost", "Estimated Cost", roundCurrency(totals.estimatedCostUsd), "USD", "estimated portfolio cost across known providers", totals.estimatedCostUsd > 0 ? "watch" : "unknown"),
            metric("reported-revenue", "Reported Revenue", totals.revenueUsd > 0 ? roundCurrency(totals.revenueUsd) : "Unknown", "USD", "reported revenue across connected business-unit feeds", totals.revenueUsd > 0 ? "healthy" : "unknown"),
            metric("cost-revenue-ratio", "Cost / Revenue", totals.revenueUsd > 0 ? `${round((totals.estimatedCostUsd / totals.revenueUsd) * 100)}%` : "Unknown", "ratio", "estimated operating capacity cost as a percentage of reported revenue", totals.revenueUsd > 0 ? "watch" : "unknown"),
            metric("provider-api-calls", "Provider API Calls", totals.apiCalls, "calls", "known API calls across provider and project feeds", "watch"),
            metric("storage-used", "Storage Used", round(totals.storageGb), "GB", "known generated asset or telemetry storage", "watch"),
            metric("successful-outputs", "Successful Outputs", totals.successfulOutputs, "outputs", "completed useful outputs across reporting workflows", "healthy"),
            metric("budget-remaining", "Budget Remaining", budgetRemainingUsd === undefined ? "Unknown" : roundCurrency(budgetRemainingUsd), "USD", "remaining budget from configured cap", budgetRemainingUsd === undefined ? "unknown" : budgetRemainingUsd <= 0 ? "blocked" : "watch"),
            metric("missing-feeds", "Missing Feeds", missingFeeds.length, "feeds", "feeds that are missing, stale, or not trusted yet", missingFeeds.length ? "degraded" : "healthy"),
        ],
        alerts: buildCapacityAlerts(input, totals),
        activity: [
            {
                id: "capacity-snapshot-generated",
                title: "Capacity snapshot generated",
                happenedAt: input.generatedAt,
                actor: "hermes-dashboard-kit",
                projectId: "hermes-technical-central-command",
                status: missingFeeds.length ? "watch" : "healthy",
                summary: "Portfolio capacity contract is available for prototype and command-center review.",
            },
        ],
        cost: buildCostContracts(input),
        systemHealth: [],
        readiness: {
            id: "capacity-command-center-readiness",
            projectId: "hermes-technical-central-command",
            readinessPercent: missingFeeds.length ? 65 : 85,
            version: "capacity-command-center-v1",
            status: missingFeeds.length ? "watch" : "healthy",
            generatedAt: input.generatedAt,
            openBlockers: missingFeeds.length,
            completedMilestones: 2,
            totalMilestones: 8,
        },
    };
}
export function buildSampleCapacityCommandCenterSnapshot(generatedAt = "2026-07-24T00:00:00.000Z") {
    return buildCapacityCommandCenterSnapshot({
        id: "hermes-capacity-command-center-sample",
        generatedAt,
        lastRefreshAt: generatedAt,
        budgetUsd: 2000,
        budgetUsedUsd: 842,
        missingFeeds: ["local-codex-token-ledger", "provider-balance-api"],
        businessUnits: [
            breakdown("media-engine", "Media Engine", "media-engine", 420000, 180000, 138.2, 0, 640, 42.1, "watch", "up", "partial"),
            breakdown("khashi-vc", "Khashi VC", "khashi-vc", 120000, 34000, 28.7, 0, 1800, 11.4, "watch", "flat", "partial"),
            breakdown("tlc-enterprise", "TLC Enterprise", "tlc-capital-group-os", 76000, 21000, 19.6, 0, 84, 3.2, "healthy", "down", "estimated"),
            breakdown("nous-hermes-agent", "Nous Hermes Agent", "nous-hermes-agent", 155000, 63000, 92.5, 0, 220, 8.7, "degraded", "up", "partial"),
        ],
        providers: [
            breakdown("openai", "OpenAI", "hermes", 310000, 142000, 186.4, undefined, 460, 0, "watch", "up", "partial"),
            breakdown("gemini", "Gemini", "hermes", 206000, 78000, 41.7, undefined, 390, 0, "healthy", "flat", "estimated"),
            breakdown("deepseek", "DeepSeek", "hermes", 98000, 41000, 9.2, undefined, 180, 0, "healthy", "flat", "estimated"),
            breakdown("local-codex", "Local Codex", "hermes", 0, 0, undefined, undefined, 0, 0, "unknown", "unknown", "missing"),
        ],
        workflows: [
            breakdown("media-generation", "Media Generation", "media-engine", 350000, 152000, 124.4, undefined, 520, 41.8, "watch", "up", "partial"),
            breakdown("market-research-scans", "Market Research Scans", "khashi-vc", 98000, 26000, 18.2, undefined, 1600, 10.2, "watch", "flat", "partial"),
            breakdown("dashboard-prototyping", "Dashboard Prototyping", "nous-hermes-agent", 118000, 44000, 65.6, undefined, 120, 1.8, "degraded", "up", "partial"),
            breakdown("readiness-rollups", "Readiness Rollups", "tlc-capital-group-os", 56000, 18000, 14.1, undefined, 70, 2.6, "healthy", "down", "estimated"),
        ],
        trends: [
            { window: "3d", tokensIn: 98000, tokensOut: 36000, estimatedCostUsd: 38.5, apiCalls: 420, storageGb: 4.4, successfulOutputs: 28 },
            { window: "7d", tokensIn: 262000, tokensOut: 97000, estimatedCostUsd: 104.2, apiCalls: 1120, storageGb: 13.8, successfulOutputs: 76 },
            { window: "14d", tokensIn: 510000, tokensOut: 188000, estimatedCostUsd: 211.7, apiCalls: 2380, storageGb: 27.4, successfulOutputs: 142 },
            { window: "30d", tokensIn: 771000, tokensOut: 298000, estimatedCostUsd: 279.0, apiCalls: 2744, storageGb: 65.4, successfulOutputs: 218 },
            { window: "90d", tokensIn: 1610000, tokensOut: 642000, estimatedCostUsd: 612.8, apiCalls: 6240, storageGb: 142.9, successfulOutputs: 504 },
        ],
    });
}
function buildCapacityModules(input, missingFeeds) {
    return [
        module("capacity-overview", "Capacity Overview", "capacity", "How much capacity is the whole portfolio consuming?", input, "watch"),
        module("business-unit-breakdown", "Business Unit Breakdown", "projects", "Which business unit is driving capacity burn?", input, worstFromBreakdowns(input.businessUnits)),
        module("provider-model-usage", "Provider And Model Usage", "capacity", "Which provider or model lane is responsible?", input, worstFromBreakdowns(input.providers)),
        module("workflow-cost-drivers", "Workflow Cost Drivers", "capacity", "Which workflows are worth optimizing?", input, worstFromBreakdowns(input.workflows)),
        module("trend-windows", "Trend Windows", "capacity", "Is usage rising, falling, or flat over 3, 7, 14, 30, and 90 days?", input, input.trends.length ? "healthy" : "unknown"),
        module("data-trust-freshness", "Data Trust And Freshness", "operations", "Which feeds are live, estimated, stale, missing, or manual?", input, missingFeeds.length ? "degraded" : "healthy"),
        module("budget-gates", "Budget Gates", "controls", "Which caps are close to breaking or require approval?", input, budgetStatus(input)),
        module("operator-attention", "Operator Attention", "command", "What should the operator do next?", input, missingFeeds.length ? "watch" : "healthy"),
    ];
}
function buildCapacityAlerts(input, totals) {
    const alerts = [];
    const budget = budgetStatus(input);
    if (budget === "blocked" || budget === "degraded") {
        alerts.push({
            id: "capacity-budget-pressure",
            title: "Capacity budget pressure",
            severity: budget,
            owner: "hermes",
            openedAt: input.generatedAt,
            resolution: "Review provider/model usage before approving premium fallback.",
        });
    }
    for (const missingFeed of input.missingFeeds ?? []) {
        alerts.push({
            id: `missing-feed-${missingFeed}`,
            title: `Missing capacity feed: ${missingFeed}`,
            severity: "degraded",
            owner: "hermes",
            openedAt: input.generatedAt,
            resolution: "Treat related metrics as estimated until the feed is connected.",
        });
    }
    if (totals.successfulOutputs > 0 && totals.estimatedCostUsd / totals.successfulOutputs > 5) {
        alerts.push({
            id: "high-cost-per-output",
            title: "High estimated cost per successful output",
            severity: "watch",
            owner: "hermes",
            openedAt: input.generatedAt,
            resolution: "Compare workflow cost drivers before expanding capacity.",
        });
    }
    return alerts;
}
function buildCostContracts(input) {
    return input.providers.map((provider) => ({
        id: `provider-cost-${provider.id}`,
        provider: provider.label,
        projectId: provider.owner,
        costUsd: provider.estimatedCostUsd,
        usageUnit: "tokens",
        usageAmount: provider.tokensIn + provider.tokensOut,
        budgetUsd: input.budgetUsd,
        window: "30d",
        status: provider.status,
        lastUpdatedAt: input.lastRefreshAt ?? input.generatedAt,
    }));
}
function calculateCapacityTotals(input) {
    const latestTrend = input.trends.find((trend) => trend.window === "30d") ?? input.trends.at(-1);
    return {
        tokensIn: sum(input.businessUnits, "tokensIn"),
        tokensOut: sum(input.businessUnits, "tokensOut"),
        estimatedCostUsd: sumOptional(input.businessUnits, "estimatedCostUsd"),
        revenueUsd: sumOptional(input.businessUnits, "revenueUsd"),
        apiCalls: sumOptional(input.businessUnits, "apiCalls"),
        storageGb: sumOptional(input.businessUnits, "storageGb"),
        successfulOutputs: latestTrend?.successfulOutputs ?? 0,
    };
}
function breakdown(id, label, owner, tokensIn, tokensOut, estimatedCostUsd, revenueUsd, apiCalls, storageGb, status, trend, dataTrust) {
    return { id, label, owner, tokensIn, tokensOut, estimatedCostUsd, revenueUsd, apiCalls, storageGb, status, trend, dataTrust };
}
function module(id, label, workspace, primaryQuestion, input, status) {
    return {
        id,
        label,
        workspace,
        status,
        owner: "hermes",
        primaryQuestion,
        dataSources: [
            {
                id: "capacity-command-center-contract",
                label: "Capacity Command Center contract",
                owner: "nous-hermes-agent",
                endpoint: "packages/hermes-dashboard-kit/src/capacity-command-center.ts",
                lastUpdatedAt: input.lastRefreshAt ?? input.generatedAt,
                freshnessSeconds: 3600,
                status: "healthy",
            },
        ],
    };
}
function metric(id, label, value, unit, detail, status) {
    return { id, label, value, unit, window: "30d", detail, status };
}
function budgetStatus(input) {
    if (typeof input.budgetUsd !== "number" || typeof input.budgetUsedUsd !== "number" || input.budgetUsd <= 0)
        return "unknown";
    const percentUsed = input.budgetUsedUsd / input.budgetUsd;
    if (percentUsed >= 1)
        return "blocked";
    if (percentUsed >= 0.85)
        return "degraded";
    if (percentUsed >= 0.65)
        return "watch";
    return "healthy";
}
function worstFromBreakdowns(breakdowns) {
    if (breakdowns.some((entry) => entry.status === "blocked"))
        return "blocked";
    if (breakdowns.some((entry) => entry.status === "degraded"))
        return "degraded";
    if (breakdowns.some((entry) => entry.status === "watch"))
        return "watch";
    if (breakdowns.some((entry) => entry.status === "unknown"))
        return "unknown";
    return "healthy";
}
function sum(items, key) {
    return items.reduce((total, item) => total + item[key], 0);
}
function sumOptional(items, key) {
    return items.reduce((total, item) => total + (item[key] ?? 0), 0);
}
function round(value) {
    return Math.round(value * 10) / 10;
}
function roundCurrency(value) {
    return Math.round(value * 100) / 100;
}
//# sourceMappingURL=capacity-command-center.js.map
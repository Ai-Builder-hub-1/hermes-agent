export function reportStatusRank(status) {
    if (status === "blocked")
        return 5;
    if (status === "degraded")
        return 4;
    if (status === "watch")
        return 3;
    if (status === "unknown")
        return 2;
    return 1;
}
export function worstReportStatus(statuses) {
    return statuses.reduce((worst, status) => (reportStatusRank(status) > reportStatusRank(worst) ? status : worst), "healthy");
}
export function aggregateExecutiveBriefingStatus(briefing) {
    return worstReportStatus([
        briefing.status,
        ...briefing.businessUnits.map((unit) => unit.status),
        ...briefing.businessUnits.flatMap((unit) => unit.officerReports.map((report) => report.status)),
    ]);
}
export function executiveDecisionQueue(briefing) {
    const byId = new Map();
    for (const decision of briefing.decisionsNeeded)
        byId.set(decision.id, decision);
    for (const unit of briefing.businessUnits) {
        for (const decision of unit.decisionsNeeded)
            byId.set(decision.id, decision);
        for (const report of unit.officerReports) {
            for (const decision of report.decisionsNeeded)
                byId.set(decision.id, decision);
        }
    }
    return Array.from(byId.values()).sort((left, right) => (decisionRiskRank(right.risk) - decisionRiskRank(left.risk)));
}
export function decisionRiskRank(risk) {
    if (risk === "critical")
        return 4;
    if (risk === "high")
        return 3;
    if (risk === "medium")
        return 2;
    return 1;
}
//# sourceMappingURL=executive-reports.js.map
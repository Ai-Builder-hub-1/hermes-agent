const themeContrastContract = {
    minimumBodyRatio: 4.5,
    minimumLargeTextRatio: 3,
    requiredPairs: [
        ["surfacePage", "textPrimary"],
        ["surfacePanel", "textPrimary"],
        ["surfacePanelStrong", "textInverse"],
        ["surfaceInset", "textSecondary"],
        ["chartTooltipBg", "chartTooltipText"],
        ["statusSuccessSoft", "statusSuccess"],
        ["statusWarningSoft", "statusWarning"],
        ["statusErrorSoft", "statusError"],
        ["statusInfoSoft", "statusInfo"]
    ]
};
const lightModeRules = [
    "Light mode uses bright neutral surfaces, dark text, subtle borders, and colored emphasis only through semantic tokens.",
    "Do not place dark-mode cards inside a light shell unless the panel uses the approved surfacePanelStrong + textInverse pair.",
    "Tables, drawers, forms, tooltips, charts, and sidebars inherit light tokens from the shell."
];
const darkModeRules = [
    "Dark mode uses one dark shell and dark panels with light text; no light cards may appear unless they use an approved inverse/evidence surface.",
    "Chart axes, grid lines, legends, and tooltip surfaces must use chart tokens instead of hardcoded black, gray, or white.",
    "Status fills must use soft dark-mode status surfaces, not light-mode pastel fills."
];
const systemModeRules = [
    "System mode is a routing mode, not a third visual palette. It must resolve to either light or dark tokens before rendering.",
    "Projects may store a system preference, but the DOM must expose the resolved data-theme state for validation."
];
function modeProfile({ mode, label, tokens, usageRules }) {
    return {
        mode,
        label,
        tokens,
        contrastContract: themeContrastContract,
        usageRules
    };
}
const lightTokens = {
    surfacePage: "#f6f8fb",
    surfacePanel: "#ffffff",
    surfacePanelMuted: "#eef3f6",
    surfacePanelStrong: "#172026",
    surfaceInset: "#f9fbfc",
    textPrimary: "#141b23",
    textSecondary: "#40505d",
    textMuted: "#667684",
    textInverse: "#f8fbfc",
    borderSubtle: "#dce4ea",
    borderStrong: "#aebcc7",
    focusRing: "#256f8d",
    chartAxis: "#667684",
    chartGrid: "#dce4ea",
    chartTooltipBg: "#111a22",
    chartTooltipText: "#f8fbfc",
    chartSeriesPrimary: "#256f8d",
    chartSeriesSecondary: "#0f9f8f",
    chartSeriesTertiary: "#8f5b25",
    statusSuccess: "#237a4b",
    statusSuccessSoft: "#e5f3eb",
    statusWarning: "#9b6b18",
    statusWarningSoft: "#fff2d9",
    statusError: "#ad3d32",
    statusErrorSoft: "#fdebe8",
    statusInfo: "#256f8d",
    statusInfoSoft: "#e4f2f6",
    shadowColor: "23 32 38"
};
const darkTokens = {
    surfacePage: "#0b1016",
    surfacePanel: "#111923",
    surfacePanelMuted: "#162231",
    surfacePanelStrong: "#eef6fb",
    surfaceInset: "#0f1721",
    textPrimary: "#edf4f8",
    textSecondary: "#c1ccd6",
    textMuted: "#8fa0ad",
    textInverse: "#111923",
    borderSubtle: "#253342",
    borderStrong: "#3a4a5a",
    focusRing: "#5bb7d6",
    chartAxis: "#9badb9",
    chartGrid: "#263544",
    chartTooltipBg: "#edf4f8",
    chartTooltipText: "#111923",
    chartSeriesPrimary: "#63c7e6",
    chartSeriesSecondary: "#5ed6b9",
    chartSeriesTertiary: "#f0b76a",
    statusSuccess: "#68d391",
    statusSuccessSoft: "#11281d",
    statusWarning: "#f6c76a",
    statusWarningSoft: "#2a2112",
    statusError: "#f08b81",
    statusErrorSoft: "#2d1716",
    statusInfo: "#63c7e6",
    statusInfoSoft: "#102636",
    shadowColor: "0 0 0"
};
export const dashboardThemeModes = {
    light: modeProfile({
        mode: "light",
        label: "Light Mode",
        tokens: lightTokens,
        usageRules: lightModeRules
    }),
    dark: modeProfile({
        mode: "dark",
        label: "Dark Mode",
        tokens: darkTokens,
        usageRules: darkModeRules
    }),
    system: modeProfile({
        mode: "system",
        label: "System Mode",
        tokens: lightTokens,
        usageRules: systemModeRules
    })
};
export const dashboardThemeProfiles = [
    {
        id: "tlc-base",
        label: "TLC Base",
        domain: "Holding company command",
        density: "balanced",
        tone: "executive",
        tokens: {
            background: "#f7f8fb",
            foreground: "#151923",
            card: "#ffffff",
            muted: "#647084",
            border: "#d8dee8",
            primary: "#2557d6",
            accent: "#0f9f8f",
            warning: "#b7791f",
            critical: "#c24141",
            success: "#18855b",
        },
        modes: dashboardThemeModes,
        notes: ["Default executive operating system theme.", "Use for Hermes central command and cross-project rollups."],
    },
    {
        id: "khashi-research",
        label: "Khashi Research",
        domain: "Research operations",
        density: "compact",
        tone: "research",
        tokens: {
            background: "#f5f7f6",
            foreground: "#111c19",
            card: "#ffffff",
            muted: "#5d6f69",
            border: "#d5ded9",
            primary: "#146b58",
            accent: "#365fc7",
            warning: "#a86d15",
            critical: "#b93a3a",
            success: "#16764e",
        },
        modes: dashboardThemeModes,
        notes: ["Dense and analytical.", "Use for markets, experiments, coverage, findings, and strategy readiness."],
    },
    {
        id: "media-publishing",
        label: "Media Publishing",
        domain: "Publishing operations",
        density: "balanced",
        tone: "publishing",
        tokens: {
            background: "#f8f7fb",
            foreground: "#181720",
            card: "#ffffff",
            muted: "#6d6878",
            border: "#ded9e8",
            primary: "#7149c6",
            accent: "#d65f3a",
            warning: "#aa6a15",
            critical: "#bf3d4b",
            success: "#168260",
        },
        modes: dashboardThemeModes,
        notes: ["More expressive while staying operational.", "Use for generation, approvals, channels, and publishing cadence."],
    },
    {
        id: "business-analytics",
        label: "Business Analytics",
        domain: "Business operations",
        density: "balanced",
        tone: "analytics",
        tokens: {
            background: "#f7f8f8",
            foreground: "#13191b",
            card: "#ffffff",
            muted: "#617076",
            border: "#d8e0e2",
            primary: "#235f73",
            accent: "#8f5b25",
            warning: "#9b6a1d",
            critical: "#b43e42",
            success: "#24734f",
        },
        modes: dashboardThemeModes,
        notes: ["Calm advisory dashboard theme.", "Use for business mapper, media business operations, and client strategy views."],
    },
];
export function dashboardThemeById(id) {
    return dashboardThemeProfiles.find((theme) => theme.id === id);
}
export function dashboardThemeCssVariables(theme) {
    const modeTokens = theme.modes?.light.tokens || dashboardThemeModes.light.tokens;
    return {
        "--hdk-background": theme.tokens.background,
        "--hdk-foreground": theme.tokens.foreground,
        "--hdk-card": theme.tokens.card,
        "--hdk-muted": theme.tokens.muted,
        "--hdk-border": theme.tokens.border,
        "--hdk-primary": theme.tokens.primary,
        "--hdk-accent": theme.tokens.accent,
        "--hdk-warning": theme.tokens.warning,
        "--hdk-critical": theme.tokens.critical,
        "--hdk-success": theme.tokens.success,
        "--hdk-surface-page": modeTokens.surfacePage,
        "--hdk-surface-panel": modeTokens.surfacePanel,
        "--hdk-surface-panel-muted": modeTokens.surfacePanelMuted,
        "--hdk-surface-panel-strong": modeTokens.surfacePanelStrong,
        "--hdk-surface-inset": modeTokens.surfaceInset,
        "--hdk-text-primary": modeTokens.textPrimary,
        "--hdk-text-secondary": modeTokens.textSecondary,
        "--hdk-text-muted": modeTokens.textMuted,
        "--hdk-text-inverse": modeTokens.textInverse,
        "--hdk-border-subtle": modeTokens.borderSubtle,
        "--hdk-border-strong": modeTokens.borderStrong,
        "--hdk-focus-ring": modeTokens.focusRing,
        "--hdk-chart-axis": modeTokens.chartAxis,
        "--hdk-chart-grid": modeTokens.chartGrid,
        "--hdk-chart-tooltip-bg": modeTokens.chartTooltipBg,
        "--hdk-chart-tooltip-text": modeTokens.chartTooltipText,
        "--hdk-chart-series-primary": modeTokens.chartSeriesPrimary,
        "--hdk-chart-series-secondary": modeTokens.chartSeriesSecondary,
        "--hdk-chart-series-tertiary": modeTokens.chartSeriesTertiary,
        "--hdk-status-success": modeTokens.statusSuccess,
        "--hdk-status-success-soft": modeTokens.statusSuccessSoft,
        "--hdk-status-warning": modeTokens.statusWarning,
        "--hdk-status-warning-soft": modeTokens.statusWarningSoft,
        "--hdk-status-error": modeTokens.statusError,
        "--hdk-status-error-soft": modeTokens.statusErrorSoft,
        "--hdk-status-info": modeTokens.statusInfo,
        "--hdk-status-info-soft": modeTokens.statusInfoSoft,
    };
}
export function dashboardThemeModeCssVariables(mode = "light") {
    const modeProfile = dashboardThemeModes[mode === "system" ? "light" : mode];
    const tokens = modeProfile.tokens;
    return {
        "--hdk-bg": tokens.surfacePage,
        "--hdk-card": tokens.surfacePanel,
        "--hdk-card-muted": tokens.surfacePanelMuted,
        "--hdk-panel-strong": tokens.surfacePanelStrong,
        "--hdk-inset": tokens.surfaceInset,
        "--hdk-text": tokens.textPrimary,
        "--hdk-text-secondary": tokens.textSecondary,
        "--hdk-muted": tokens.textMuted,
        "--hdk-inverse": tokens.textInverse,
        "--hdk-border": tokens.borderSubtle,
        "--hdk-border-strong": tokens.borderStrong,
        "--hdk-primary": tokens.chartSeriesPrimary,
        "--hdk-primary-soft": tokens.statusInfoSoft,
        "--hdk-accent": tokens.chartSeriesSecondary,
        "--hdk-success": tokens.statusSuccess,
        "--hdk-success-soft": tokens.statusSuccessSoft,
        "--hdk-warning": tokens.statusWarning,
        "--hdk-warning-soft": tokens.statusWarningSoft,
        "--hdk-critical": tokens.statusError,
        "--hdk-critical-soft": tokens.statusErrorSoft,
        "--hdk-info": tokens.statusInfo,
        "--hdk-info-soft": tokens.statusInfoSoft,
        "--hdk-focus": tokens.focusRing,
        "--hdk-chart-axis": tokens.chartAxis,
        "--hdk-chart-grid": tokens.chartGrid,
        "--hdk-chart-tooltip-bg": tokens.chartTooltipBg,
        "--hdk-chart-tooltip-text": tokens.chartTooltipText,
        "--hdk-chart-series-primary": tokens.chartSeriesPrimary,
        "--hdk-chart-series-secondary": tokens.chartSeriesSecondary,
        "--hdk-chart-series-tertiary": tokens.chartSeriesTertiary,
        "--hdk-shadow-rgb": tokens.shadowColor
    };
}
//# sourceMappingURL=themes.js.map
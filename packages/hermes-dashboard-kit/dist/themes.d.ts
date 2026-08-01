export interface DashboardThemeTokenSet {
    background: string;
    foreground: string;
    card: string;
    muted: string;
    border: string;
    primary: string;
    accent: string;
    warning: string;
    critical: string;
    success: string;
}
export type DashboardThemeMode = "light" | "dark" | "system";
export interface DashboardThemeModeTokenSet {
    surfacePage: string;
    surfacePanel: string;
    surfacePanelMuted: string;
    surfacePanelStrong: string;
    surfaceInset: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    borderSubtle: string;
    borderStrong: string;
    focusRing: string;
    chartAxis: string;
    chartGrid: string;
    chartTooltipBg: string;
    chartTooltipText: string;
    chartSeriesPrimary: string;
    chartSeriesSecondary: string;
    chartSeriesTertiary: string;
    statusSuccess: string;
    statusSuccessSoft: string;
    statusWarning: string;
    statusWarningSoft: string;
    statusError: string;
    statusErrorSoft: string;
    statusInfo: string;
    statusInfoSoft: string;
    shadowColor: string;
}
export interface DashboardThemeModeProfile {
    mode: DashboardThemeMode;
    label: string;
    tokens: DashboardThemeModeTokenSet;
    contrastContract: {
        minimumBodyRatio: number;
        minimumLargeTextRatio: number;
        requiredPairs: Array<[keyof DashboardThemeModeTokenSet, keyof DashboardThemeModeTokenSet]>;
    };
    usageRules: string[];
}
export interface DashboardThemeProfile {
    id: string;
    label: string;
    domain: string;
    density: "compact" | "balanced" | "spacious";
    tone: "executive" | "research" | "publishing" | "analytics" | "system";
    tokens: DashboardThemeTokenSet;
    modes?: {
        light: DashboardThemeModeProfile;
        dark: DashboardThemeModeProfile;
        system: DashboardThemeModeProfile;
    };
    notes: string[];
}
export declare const dashboardThemeModes: {
    light: DashboardThemeModeProfile;
    dark: DashboardThemeModeProfile;
    system: DashboardThemeModeProfile;
};
export declare const dashboardThemeProfiles: DashboardThemeProfile[];
export declare function dashboardThemeById(id: string): DashboardThemeProfile | undefined;
export declare function dashboardThemeCssVariables(theme: DashboardThemeProfile): {
    readonly "--hdk-background": string;
    readonly "--hdk-foreground": string;
    readonly "--hdk-card": string;
    readonly "--hdk-muted": string;
    readonly "--hdk-border": string;
    readonly "--hdk-primary": string;
    readonly "--hdk-accent": string;
    readonly "--hdk-warning": string;
    readonly "--hdk-critical": string;
    readonly "--hdk-success": string;
    readonly "--hdk-surface-page": string;
    readonly "--hdk-surface-panel": string;
    readonly "--hdk-surface-panel-muted": string;
    readonly "--hdk-surface-panel-strong": string;
    readonly "--hdk-surface-inset": string;
    readonly "--hdk-text-primary": string;
    readonly "--hdk-text-secondary": string;
    readonly "--hdk-text-muted": string;
    readonly "--hdk-text-inverse": string;
    readonly "--hdk-border-subtle": string;
    readonly "--hdk-border-strong": string;
    readonly "--hdk-focus-ring": string;
    readonly "--hdk-chart-axis": string;
    readonly "--hdk-chart-grid": string;
    readonly "--hdk-chart-tooltip-bg": string;
    readonly "--hdk-chart-tooltip-text": string;
    readonly "--hdk-chart-series-primary": string;
    readonly "--hdk-chart-series-secondary": string;
    readonly "--hdk-chart-series-tertiary": string;
    readonly "--hdk-status-success": string;
    readonly "--hdk-status-success-soft": string;
    readonly "--hdk-status-warning": string;
    readonly "--hdk-status-warning-soft": string;
    readonly "--hdk-status-error": string;
    readonly "--hdk-status-error-soft": string;
    readonly "--hdk-status-info": string;
    readonly "--hdk-status-info-soft": string;
};
export declare function dashboardThemeModeCssVariables(mode?: DashboardThemeMode): {
    readonly "--hdk-bg": string;
    readonly "--hdk-card": string;
    readonly "--hdk-card-muted": string;
    readonly "--hdk-panel-strong": string;
    readonly "--hdk-inset": string;
    readonly "--hdk-text": string;
    readonly "--hdk-text-secondary": string;
    readonly "--hdk-muted": string;
    readonly "--hdk-inverse": string;
    readonly "--hdk-border": string;
    readonly "--hdk-border-strong": string;
    readonly "--hdk-primary": string;
    readonly "--hdk-primary-soft": string;
    readonly "--hdk-accent": string;
    readonly "--hdk-success": string;
    readonly "--hdk-success-soft": string;
    readonly "--hdk-warning": string;
    readonly "--hdk-warning-soft": string;
    readonly "--hdk-critical": string;
    readonly "--hdk-critical-soft": string;
    readonly "--hdk-info": string;
    readonly "--hdk-info-soft": string;
    readonly "--hdk-focus": string;
    readonly "--hdk-chart-axis": string;
    readonly "--hdk-chart-grid": string;
    readonly "--hdk-chart-tooltip-bg": string;
    readonly "--hdk-chart-tooltip-text": string;
    readonly "--hdk-chart-series-primary": string;
    readonly "--hdk-chart-series-secondary": string;
    readonly "--hdk-chart-series-tertiary": string;
    readonly "--hdk-shadow-rgb": string;
};
//# sourceMappingURL=themes.d.ts.map
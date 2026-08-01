import type { ReactNode } from "react";
import { type DashboardTone } from "./metrics";
export type InterfaceStateStatus = "ready" | "loading" | "empty" | "error" | "stale" | "preview" | "permission-limited" | "partial";
export type WorkspaceOption = {
    id: string;
    label: string;
    description?: string;
    badge?: ReactNode;
    disabled?: boolean;
};
export type BreadcrumbItem = {
    label: string;
    href?: string;
};
export type EvidenceItem = {
    id: string;
    title: string;
    detail?: string;
    sourceLabel?: string;
    freshnessLabel?: string;
    tone?: DashboardTone;
};
export type RecommendationItem = {
    id: string;
    title: string;
    action: string;
    confidence?: number;
    tone?: DashboardTone;
};
export type CommandPaletteItem = {
    id: string;
    label: string;
    description?: string;
    shortcut?: string;
    group?: string;
    tone?: DashboardTone;
    disabled?: boolean;
};
export type SavedViewItem = {
    id: string;
    label: string;
    description?: string;
    filters?: string[];
    active?: boolean;
    shared?: boolean;
};
export type ExpandableDataListRow = {
    id: string;
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    status?: ReactNode;
    summary?: ReactNode;
    detail?: ReactNode;
};
export type CalendarDayItem = {
    id: string;
    label: string;
    dateLabel?: string;
    status?: "planned" | "open" | "blocked" | "complete";
    summary?: string;
    selected?: boolean;
    disabled?: boolean;
};
export type ApprovalQueueItem = {
    id: string;
    title: string;
    detail?: string;
    status: "pending" | "approved" | "rejected" | "needs-review";
    owner?: string;
    dueLabel?: string;
};
export type PublishingQueueItem = {
    id: string;
    title: string;
    destination: string;
    scheduledLabel?: string;
    status: "draft" | "ready" | "posted" | "blocked";
};
export type ProofEvidenceRecord = {
    id: string;
    label: string;
    value: string;
    detail?: string;
    tone?: DashboardTone;
};
export declare function WorkspaceSwitcher({ label, value, options, onChange, className, }: {
    label?: string;
    value: string;
    options: WorkspaceOption[];
    onChange?: (value: string) => void;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function BreadcrumbTrail({ items, className, }: {
    items: BreadcrumbItem[];
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function SplitWorkspaceLayout({ primary, secondary, ratio, className, }: {
    primary: ReactNode;
    secondary: ReactNode;
    ratio?: "balanced" | "primary-wide" | "secondary-wide";
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function DetailDrawerShell({ title, subtitle, status, actions, children, footer, className, }: {
    title: string;
    subtitle?: string;
    status?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function EntitySummaryCard({ title, subtitle, meta, tone, children, }: {
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    tone?: DashboardTone;
    children?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function EvidenceStack({ items, title, }: {
    items: EvidenceItem[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function RecommendationStack({ items, title, }: {
    items: RecommendationItem[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function SavedFilterChips({ filters, activeId, onSelect, }: {
    filters: {
        id: string;
        label: string;
        detail?: string;
    }[];
    activeId?: string;
    onSelect?: (id: string) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function CommandPalette({ query, items, title, placeholder, footer, onQueryChange, onSelect, }: {
    query?: string;
    items: CommandPaletteItem[];
    title?: string;
    placeholder?: string;
    footer?: ReactNode;
    onQueryChange?: (value: string) => void;
    onSelect?: (item: CommandPaletteItem) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function GlobalSearchOverlay({ query, results, scopes, activeScope, onQueryChange, onScopeChange, onSelect, }: {
    query?: string;
    results: CommandPaletteItem[];
    scopes?: {
        id: string;
        label: string;
        count?: number;
    }[];
    activeScope?: string;
    onQueryChange?: (value: string) => void;
    onScopeChange?: (value: string) => void;
    onSelect?: (item: CommandPaletteItem) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function SavedViewsManager({ views, title, onSelect, }: {
    views: SavedViewItem[];
    title?: string;
    onSelect?: (view: SavedViewItem) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function ExpandableDataList({ rows, title, }: {
    rows: ExpandableDataListRow[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function AiAssistantPanel({ title, prompt, response, sources, actions, }: {
    title?: string;
    prompt?: string;
    response?: ReactNode;
    sources?: EvidenceItem[];
    actions?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function StateChecklist({ states, }: {
    states: {
        id: InterfaceStateStatus;
        label?: string;
        supported: boolean;
        detail?: string;
    }[];
}): import("react/jsx-runtime").JSX.Element;
export declare function PermissionLimitedPanel({ title, description, }: {
    title?: string;
    description?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function CalendarMonthGrid({ days, title, onSelect, }: {
    days: CalendarDayItem[];
    title?: string;
    onSelect?: (day: CalendarDayItem) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function ApprovalQueuePanel({ items, title, onApprove, onReject, }: {
    items: ApprovalQueueItem[];
    title?: string;
    onApprove?: (item: ApprovalQueueItem) => void;
    onReject?: (item: ApprovalQueueItem) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function PublishingQueuePanel({ items, title, }: {
    items: PublishingQueueItem[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function ProofEvidencePanel({ records, title, }: {
    records: ProofEvidenceRecord[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function DirectPostingControlPanel({ enabled, destinations, title, }: {
    enabled: boolean;
    destinations: {
        id: string;
        label: string;
        status: "postable" | "manual" | "blocked";
        detail?: string;
    }[];
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function GeneratedInsightCallout({ children, label, }: {
    children: ReactNode;
    label?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=product-interface.d.ts.map
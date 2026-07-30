import type { ReactNode } from "react";
import { type DashboardTone } from "./metrics";
export type DashboardVizState = "ready" | "loading" | "empty" | "error" | "preview" | "stale";
export type MarketSnapshotPoint = {
    label: string;
    timestamp?: string;
    midPrice: number;
    spread?: number;
    bidDepth?: number;
    askDepth?: number;
    volume?: number;
};
export type MarketTapeRow = {
    id: string;
    title: string;
    ticker?: string;
    category?: string;
    status?: "live" | "expired" | "upcoming" | "unknown";
    midPrice?: number;
    movementCents?: number;
    spreadCents?: number;
    totalDepth?: number;
    volume24h?: number;
    openInterest?: number;
    lastSeenLabel?: string;
    tone?: DashboardTone;
};
export type OpportunityCell = {
    row: string;
    column: string;
    value: number;
    label?: string;
    tone?: DashboardTone;
};
export type AlertRailItem = {
    id: string;
    title: string;
    detail?: string;
    tone?: DashboardTone;
    timestampLabel?: string;
};
export type OrderBookLevel = {
    price: number;
    bidSize?: number;
    askSize?: number;
    bidCount?: number;
    askCount?: number;
};
export type ForecastConePoint = {
    label: string;
    low: number;
    expected: number;
    high: number;
    actual?: number;
};
export type WaterfallStep = {
    id: string;
    label: string;
    value: number;
    tone?: DashboardTone;
};
export declare function VisualizationStateFrame({ state, title, description, children, className, }: {
    state?: DashboardVizState;
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function PriceMovementChart({ data, state, height, title, }: {
    data: MarketSnapshotPoint[];
    state?: DashboardVizState;
    height?: number;
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function SpreadBandChart({ data, state, height, }: {
    data: MarketSnapshotPoint[];
    state?: DashboardVizState;
    height?: number;
}): import("react/jsx-runtime").JSX.Element;
export declare function LiquidityDepthChart({ data, state, height, }: {
    data: MarketSnapshotPoint[];
    state?: DashboardVizState;
    height?: number;
}): import("react/jsx-runtime").JSX.Element;
export declare function VolumePulseChart({ data, state, height, }: {
    data: MarketSnapshotPoint[];
    state?: DashboardVizState;
    height?: number;
}): import("react/jsx-runtime").JSX.Element;
export declare function MarketTape({ rows, selectedId, onSelect, state, }: {
    rows: MarketTapeRow[];
    selectedId?: string;
    onSelect?: (row: MarketTapeRow) => void;
    state?: DashboardVizState;
}): import("react/jsx-runtime").JSX.Element;
export declare function MarketVolatilityDrawer({ title, subtitle, points, state, actions, }: {
    title: string;
    subtitle?: string;
    points: MarketSnapshotPoint[];
    state?: DashboardVizState;
    actions?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function CategoryHeatmap({ rows, columns, cells, state, }: {
    rows: string[];
    columns: string[];
    cells: OpportunityCell[];
    state?: DashboardVizState;
}): import("react/jsx-runtime").JSX.Element;
export declare function OpportunityMatrix(props: Parameters<typeof CategoryHeatmap>[0]): import("react/jsx-runtime").JSX.Element;
export declare function ProviderSpendTimeline({ data, state, height, }: {
    data: {
        label: string;
        cost: number;
        tokens?: number;
    }[];
    state?: DashboardVizState;
    height?: number;
}): import("react/jsx-runtime").JSX.Element;
export declare function CrosshairTooltipFrame({ title, description, children, state, }: {
    title: string;
    description?: string;
    children: ReactNode;
    state?: DashboardVizState;
}): import("react/jsx-runtime").JSX.Element;
export declare function OrderBookLadder({ levels, state, title, }: {
    levels: OrderBookLevel[];
    state?: DashboardVizState;
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function ForecastConeChart({ data, state, height, title, }: {
    data: ForecastConePoint[];
    state?: DashboardVizState;
    height?: number;
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function WaterfallChart({ data, state, height, title, }: {
    data: WaterfallStep[];
    state?: DashboardVizState;
    height?: number;
    title?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function BusinessUnitCostCard({ name, cost, revenue, tokenCount, tone, }: {
    name: string;
    cost: number;
    revenue?: number;
    tokenCount?: number;
    tone?: DashboardTone;
}): import("react/jsx-runtime").JSX.Element;
export declare function AlertRail({ items, state, }: {
    items: AlertRailItem[];
    state?: DashboardVizState;
}): import("react/jsx-runtime").JSX.Element;
export declare function DrilldownPanel({ title, subtitle, children, footer, }: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function TimeWindowSelector({ value, options, onChange, }: {
    value: string;
    options: {
        label: string;
        value: string;
    }[];
    onChange?: (value: string) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function dashboardVizPreviewMarketPoints(): MarketSnapshotPoint[];
//# sourceMappingURL=data-visualization.d.ts.map
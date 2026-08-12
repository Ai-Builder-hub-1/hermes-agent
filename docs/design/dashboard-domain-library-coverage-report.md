# Dashboard Domain Library Coverage Report

Generated: 2026-08-12T13:14:16.591Z

This report distinguishes registry approval from actual dashboard-kit implementation. A missing wrapper means projects still lack a package-native primitive for that domain.

| Domain | Default | Status | Coverage | Implemented | Missing |
| --- | --- | --- | --- | --- | --- |
| Financial And Trading Charts | lightweight-charts | covered | 100% | FinancialCandlestickChart, MarketTapeChart, VolumeHistogram, IndicatorOverlay, PriceLineOverlay | none |
| General Dashboard Charts | recharts | covered | 100% | MetricTimelineChart, ComparisonTrendChart, IssueTrendChart, DonutBreakdownChart, BarComparisonChart | none |
| Data Tables And Evidence Grids | tanstack-table | covered | 100% | EvidenceDataTable, PaginatedTableCard, TableToolbar, SortableMetricTable, DenseOperationsGrid | none |
| Calendar And Scheduling | fullcalendar | covered | 100% | DashboardCalendar, MonthPlanner, WeekPlanningDrawer, ScheduleEventCard, CalendarToolbar | none |
| Workflow And Drag-Drop | dnd-kit | covered | 100% | WorkflowBoard, SortableQueue, AssignmentLane, DragDropReviewList | none |
| Node Graphs And Pipelines | react-flow | covered | 100% | StoryTreeGraph, PipelineGraph, EvidenceRelationshipGraph, GraphInspectorDrawer | none |
| Rich Text And Research Documents | tiptap | covered | 100% | ResearchEditor, ScriptEditor, EvidenceAnnotationEditor, DecisionMemoEditor | none |
| Image And Thumbnail Generation | sharp | covered | 100% | ThumbnailPipelineRenderer, ImageSharpnessQa, AssetManifestPreview, ThumbnailProofCard | none |
| Interactive Canvas Editing | react-konva | covered | 100% | CreativeCanvasEditor, CanvasLayerPanel, ThumbnailTextOverlayEditor, CanvasExportProof | none |
| Video Template Generation | remotion | covered | 100% | VideoTemplatePreview, RenderQueueStatus, ClipExtractionPanel, VideoPackageProofCard | none |
| Forms And Validation | react-hook-form-zod | covered | 100% | ValidatedForm, ApprovalReasonForm, ResearchIntakeForm, TradingSafetyForm, SettingsFormSection | none |

## Required Next Work

- Implement missing wrappers inside `packages/hermes-dashboard-kit/src`.
- Add each wrapper to `packages/hermes-dashboard-kit/src/index.ts` or the static renderer export surface when applicable.
- Add visual proof for each domain before downstream projects claim T3C.

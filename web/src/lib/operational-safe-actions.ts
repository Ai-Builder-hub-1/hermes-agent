import {
  OPERATIONAL_PAGE_CONTRACTS,
  type OperationalGroup,
  type OperationalPageContract,
} from "./operational-page-contracts";

export type SafeActionRisk = "read_only" | "evidence_write" | "proxy_control" | "review_required";

export interface OperationalSafeAction {
  id: string;
  route: string;
  group: OperationalGroup;
  pageLabel: string;
  endpoint: string;
  risk: SafeActionRisk;
  evidenceContract: string[];
  liveSources: string[];
  auditWritebackExpected: boolean;
  gaps: string[];
}

export interface SafeActionAudit {
  actions: OperationalSafeAction[];
  totals: {
    actions: number;
    evidenceBacked: number;
    auditExpected: number;
    needsHardening: number;
  };
  gaps: Array<{ id: string; route: string; endpoint: string; gaps: string[] }>;
}

export function buildSafeActionRegistry(contracts: OperationalPageContract[] = OPERATIONAL_PAGE_CONTRACTS): OperationalSafeAction[] {
  return contracts.flatMap((contract) => contract.safeActions.map((endpoint) => {
    const risk = riskForEndpoint(endpoint);
    const gaps = [
      ...(contract.evidence.length ? [] : ["missing evidence contract"]),
      ...(contract.liveSources.length ? [] : ["missing live source"]),
      ...(risk === "proxy_control" && !contract.gaps.some((gap) => /approval|audit|control|closeout/i.test(gap)) ? ["proxy control needs explicit closeout/audit gap"] : []),
    ];
    return {
      id: `${contract.route}:${endpoint}`,
      route: contract.route,
      group: contract.group,
      pageLabel: contract.label,
      endpoint,
      risk,
      evidenceContract: contract.evidence,
      liveSources: contract.liveSources,
      auditWritebackExpected: contract.evidence.length > 0,
      gaps,
    };
  }));
}

export function auditSafeActions(actions: OperationalSafeAction[] = buildSafeActionRegistry()): SafeActionAudit {
  const gaps = actions
    .filter((action) => action.gaps.length)
    .map((action) => ({ id: action.id, route: action.route, endpoint: action.endpoint, gaps: action.gaps }));
  return {
    actions,
    totals: {
      actions: actions.length,
      evidenceBacked: actions.filter((action) => action.evidenceContract.length > 0).length,
      auditExpected: actions.filter((action) => action.auditWritebackExpected).length,
      needsHardening: gaps.length,
    },
    gaps,
  };
}

export function riskForEndpoint(endpoint: string): SafeActionRisk {
  if (/dry-run|check|scan|review|summary|series|ledger/i.test(endpoint)) return "read_only";
  if (/evidence|sync|restore-proof|record/i.test(endpoint)) return "evidence_write";
  if (/control|decision|workbench|incidents|deployments/i.test(endpoint)) return "proxy_control";
  return "review_required";
}

import { useContext, useId, useMemo } from "react";
import { PageHeaderContext, type PageHeaderContextValue } from "./page-header-context";

export function usePageHeader(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  // Stable for the life of this component, so a slot can tell one page's
  // writes from another's and only the page that filled a slot can clear it.
  const owner = useId();
  const value = useMemo<PageHeaderContextValue>(
    () => ({
      setAfterTitle: (node) => ctx?.writeAfterTitle(owner, node),
      setEnd: (node) => ctx?.writeEnd(owner, node),
      setTitle: (title) => ctx?.writeTitle(owner, title),
    }),
    [ctx, owner],
  );
  if (!ctx) {
    throw new Error("usePageHeader must be used within a PageHeaderProvider");
  }
  return value;
}

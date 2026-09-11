import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { PageHeaderContext } from "./page-header-context";
import { resolvePageTitle } from "@/lib/resolve-page-title";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

type Slot<T> = { owner: string; value: T } | null;

/**
 * Last non-empty write wins the slot; an empty write only lands if it comes
 * from the page that currently holds it.
 *
 * Pages clear their header slots from an effect cleanup, and React does not
 * promise that an outgoing page's cleanup runs before an incoming page's
 * effects — with lazy routes it frequently runs after. Letting any page blank
 * a slot it does not own meant the incoming page's toolbar vanished a frame
 * after it appeared, with no dependency change left to re-fire its effect.
 */
function claim<T>(prev: Slot<T>, owner: string, value: T): Slot<T> {
  if (value === null || value === undefined) {
    return prev && prev.owner !== owner ? prev : null;
  }
  return { owner, value };
}

export function PageHeaderProvider({
  children,
  pluginTabs,
}: {
  children: ReactNode;
  pluginTabs: { path: string; label: string }[];
}) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [titleSlot, setTitleSlot] = useState<Slot<string | null>>(null);
  const [afterTitleSlot, setAfterTitleSlot] = useState<Slot<ReactNode>>(null);
  const [endSlot, setEndSlot] = useState<Slot<ReactNode>>(null);
  const titleOverride = titleSlot?.value ?? null;
  const afterTitle = afterTitleSlot?.value ?? null;
  const end = endSlot?.value ?? null;

  const writeTitle = useCallback(
    (owner: string, title: string | null) => setTitleSlot((prev) => claim(prev, owner, title)),
    [],
  );
  const writeAfterTitle = useCallback(
    (owner: string, node: ReactNode) => setAfterTitleSlot((prev) => claim(prev, owner, node)),
    [],
  );
  const writeEnd = useCallback(
    (owner: string, node: ReactNode) => setEndSlot((prev) => claim(prev, owner, node)),
    [],
  );

  // Clear any per-page title / toolbar slots when the path changes. Child routes
  // re-fill these on mount via usePageHeader.
  //
  // This resets during render, not in a layout effect, and that is load-bearing:
  // React runs a child's layout effects BEFORE its parent's, so clearing here in
  // an effect wiped whatever the incoming page had just set. Pages whose data
  // resolved before the first layout-effect flush (cached responses, a fast
  // loopback server) lost their header slot for the rest of the page's life,
  // because their own effect had no further dependency change to re-fire on.
  // Resetting during the provider's own render happens before the new route's
  // children render at all, so nothing a page sets is ever thrown away.
  const [slotPath, setSlotPath] = useState(pathname);
  if (slotPath !== pathname) {
    setSlotPath(pathname);
    setTitleSlot(null);
    setAfterTitleSlot(null);
    setEndSlot(null);
  }

  const defaultTitle = useMemo(
    () => resolvePageTitle(pathname, t, pluginTabs),
    [pathname, t, pluginTabs],
  );
  const displayTitle = titleOverride ?? defaultTitle;

  const isChatRoute = pathname === "/chat" || pathname === "/chat/";
  /** Env jump-nav is wide — stack below title on small screens so KEYS stays readable. */
  const isEnvRoute =
    pathname === "/env" || pathname.startsWith("/env/");

  const value = useMemo(
    () => ({ writeAfterTitle, writeEnd, writeTitle }),
    [writeAfterTitle, writeEnd, writeTitle],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "z-1 w-full shrink-0",
            "box-border border-b border-current/20",
            "bg-background-base",
            // Mobile stacks title + toolbar — fixed h-14 clips content; desktop stays one row.
            "min-h-0 overflow-x-hidden overflow-y-visible py-3 sm:h-14 sm:min-h-[3.5rem] sm:overflow-hidden sm:py-0",
          )}
          role="banner"
        >
          <div
            className={cn(
              "flex w-full min-w-0 flex-1 gap-3 px-3 sm:h-full sm:gap-3 sm:px-6",
              isChatRoute
                ? "flex-row items-center"
                : "flex-col justify-center sm:flex-row sm:items-center",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-2 sm:gap-3",
                afterTitle && isEnvRoute
                  ? "flex-col items-start sm:flex-row sm:items-center"
                  : afterTitle
                    ? "flex-row flex-wrap items-center"
                    : "flex-row items-center",
              )}
            >
              <h1
                className={cn(
                  "font-expanded min-w-0 text-sm font-bold tracking-[0.08em] text-midground",
                  afterTitle && isEnvRoute
                    ? "max-w-full sm:min-w-0 sm:shrink sm:truncate"
                    : afterTitle
                      ? "shrink truncate"
                      : "truncate",
                )}
              >
                {displayTitle}
              </h1>
              {afterTitle ? (
                <div
                  className={cn(
                    "min-w-0 scrollbar-none",
                    isEnvRoute
                      ? "w-full overflow-x-auto sm:flex-1 sm:overflow-x-auto"
                      : "shrink-0 overflow-visible",
                  )}
                >
                  {afterTitle}
                </div>
              ) : null}
            </div>

            {end ? (
              <div
                className={cn(
                  "flex min-w-0 sm:max-w-md sm:flex-1",
                  isChatRoute
                    ? "w-auto shrink-0 justify-end"
                    : "w-full justify-start sm:justify-end",
                )}
              >
                {end}
              </div>
            ) : null}
          </div>
        </header>

        <main
          className={cn(
            "min-h-0 w-full min-w-0 flex-1 flex flex-col",
            // Bottom inset for scrolled pages lives on the route outlet wrapper in
            // `App.tsx` (`w-full min-w-0`) so it pads scrollable content, not flex chrome.
            isChatRoute
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]",
          )}
        >
          {children}
        </main>
      </div>
    </PageHeaderContext.Provider>
  );
}

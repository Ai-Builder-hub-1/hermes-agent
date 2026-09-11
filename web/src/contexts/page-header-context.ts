import { createContext } from "react";
import type { ReactNode } from "react";

/**
 * What a page sees. Unchanged on purpose: every page calls these three.
 */
export interface PageHeaderContextValue {
  setAfterTitle: (node: ReactNode) => void;
  setEnd: (node: ReactNode) => void;
  setTitle: (title: string | null) => void;
}

/**
 * What the provider actually stores. Each slot remembers which page filled it.
 *
 * Header slots are one shared box that many pages write to, and pages clear
 * their slots from an effect cleanup. Without an owner, an outgoing page's
 * cleanup could run after the incoming page had already filled the slot and
 * blank it — the incoming page then has no dependency change left to re-fire
 * on, so its toolbar stays missing until the next data refresh. Recording the
 * owner lets the provider ignore a clear from a page that no longer holds the
 * slot.
 */
export interface PageHeaderSlotWriters {
  writeAfterTitle: (owner: string, node: ReactNode) => void;
  writeEnd: (owner: string, node: ReactNode) => void;
  writeTitle: (owner: string, title: string | null) => void;
}

export const PageHeaderContext = createContext<PageHeaderSlotWriters | null>(
  null,
);

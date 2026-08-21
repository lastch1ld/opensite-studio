// docs/popups-and-modals.md's trigger union: reuses `collectionFieldEquals`'s
// shape from lib/condition.ts's Condition type for the data-driven case
// rather than inventing a fourth conditional-logic dialect.
export type PopupTrigger =
  | { type: "pageLoad"; delaySeconds?: number }
  | { type: "scrollPercent"; percent: number }
  | { type: "exitIntent" }
  | { type: "elementClick"; blockId: string }
  | { type: "collectionFieldEquals"; collectionId: string; field: string; value: unknown };

export type PopupFrequency =
  | { mode: "everyTime" }
  | { mode: "oncePerSession" }
  | { mode: "onceEveryNDays"; days: number };

// Everything a Popup Template needs beyond the shared targeting `condition`
// (which stays on Template.condition, per theme-builder.md: eligibility and
// timing are separate concerns). Stored as Template.trigger (Json).
export type PopupSettings = {
  trigger: PopupTrigger;
  frequency: PopupFrequency;
  closeOnButton: boolean;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
};

export function defaultPopupSettings(): PopupSettings {
  return {
    trigger: { type: "pageLoad", delaySeconds: 3 },
    frequency: { mode: "oncePerSession" },
    closeOnButton: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
  };
}

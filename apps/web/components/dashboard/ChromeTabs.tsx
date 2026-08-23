"use client";

import * as Tabs from "@radix-ui/react-tabs";

// Thin styling wrapper around Radix Tabs for the dashboard/editor chrome
// (docs/editor-ui-stack.md's "adopt Radix directly, style it ourselves"
// call) — never used by the block-rendering canvas/registry itself.
export function ChromeTabs({
  defaultValue,
  tabs,
}: {
  defaultValue: string;
  tabs: { value: string; label: string; content: React.ReactNode }[];
}) {
  return (
    <Tabs.Root defaultValue={defaultValue}>
      <Tabs.List className="chrome-tabs-list">
        {tabs.map((t) => (
          <Tabs.Trigger key={t.value} value={t.value} className="chrome-tab">
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content key={t.value} value={t.value} className="mt-6 focus-visible:outline-none">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

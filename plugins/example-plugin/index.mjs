// Reference plugin for opensite-studio's Block SDK (docs/plugin-sdk.md).
//
// This file is the plugin's entry point, named by plugin.json's "main". It
// is loaded directly by Node at server startup (apps/web/lib/plugins/
// loadPlugins.ts) — NOT run through the Next.js/webpack build — so it has
// to be plain, already-runnable JavaScript. No JSX, no TypeScript syntax:
// use React.createElement the way this file does. If you want to author a
// plugin in TypeScript/JSX, compile it to plain JS first and point "main"
// at the compiled output.
//
// The loader expects a named export called `blocks`: an array of block
// definitions matching @opensite/block-sdk's `BlockDefinition` shape
// (type/label/defaultProps/defaultStyle/inspector/render). The loader
// itself calls registerBlock() for each one — this file only describes
// the blocks, it doesn't need to import @opensite/block-sdk itself.
//
// Block types are namespaced as "<plugin-name>/<block-name>" so they
// can't collide with opensite-studio's built-in blocks or another
// plugin's — see plugin.json's "name".

import React from "react";

const TONE_COLORS = {
  info: { background: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a" },
  warning: { background: "#fffbeb", border: "#fde68a", text: "#78350f" },
};

export const blocks = [
  {
    type: "example-plugin/callout",
    label: "Callout (Example Plugin)",
    defaultProps: {
      text: "This block is registered by /plugins/example-plugin — a working example of the Block SDK end to end.",
      tone: "info",
    },
    defaultStyle: {},
    inspector: [
      { key: "text", label: "Text", group: "props", input: "textarea" },
      {
        key: "tone",
        label: "Tone",
        group: "props",
        input: "select",
        options: [
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
        ],
      },
    ],
    render(props, _style, _children, _meta) {
      const tone = props.tone === "warning" ? "warning" : "info";
      const colors = TONE_COLORS[tone];
      return React.createElement(
        "div",
        {
          style: {
            padding: "12px 16px",
            borderRadius: "6px",
            background: colors.background,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: "14px",
          },
        },
        typeof props.text === "string" ? props.text : "",
      );
    },
  },
];

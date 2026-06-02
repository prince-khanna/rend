"use client";

import { useState } from "react";

type Props = { url: string };

const btnStyle = (copied: boolean): React.CSSProperties => ({
  background: copied ? "var(--tonal-bg)" : "transparent",
  border: `1px solid ${copied ? "transparent" : "var(--border-hover)"}`,
  color: copied ? "var(--tonal-fg)" : "var(--muted)",
  padding: "5px 10px",
  fontSize: "11px",
  fontFamily: "var(--font-jetbrains)",
  cursor: "pointer",
  letterSpacing: "0.06em",
  borderRadius: "var(--radius-sm)",
  transition: "background var(--duration-fast) var(--ease-fluid), border-color var(--duration-fast) var(--ease-fluid), color var(--duration-fast) var(--ease-fluid)",
  whiteSpace: "nowrap",
});

export function CopyLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy} style={btnStyle(copied)}>
      {copied ? "✓ copied" : "copy link"}
    </button>
  );
}

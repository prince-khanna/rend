"use client";

import { useState } from "react";

type Props = { url: string };

const btnStyle = (copied: boolean): React.CSSProperties => ({
  background: copied ? "rgba(226,247,64,0.12)" : "transparent",
  border: `1px solid ${copied ? "var(--accent)" : "var(--border-hover)"}`,
  color: copied ? "var(--accent)" : "var(--muted)",
  padding: "5px 10px",
  fontSize: "11px",
  fontFamily: "var(--font-jetbrains)",
  cursor: "pointer",
  letterSpacing: "0.06em",
  transition: "all 0.15s",
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

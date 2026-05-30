"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = { pageId: string; currentName: string };

export function RenamePageButton({ pageId, currentName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nextName = name.trim();
    if (!nextName) {
      setError("Name is required");
      return;
    }
    if (nextName === currentName) {
      setEditing(false);
      return;
    }

    const response = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not rename page");
      return;
    }

    setName(nextName);
    setEditing(false);
    startTransition(() => router.refresh());
  }

  if (editing) {
    return (
      <form
        onSubmit={handleRename}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          minWidth: 0,
          position: "relative",
        }}
      >
        <input
          ref={inputRef}
          value={name}
          onChange={event => setName(event.target.value)}
          maxLength={120}
          aria-label="Page name"
          className="input-base"
          style={{
            width: "min(220px, 42vw)",
            height: "28px",
            padding: "5px 8px",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "12px",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          title="Save page name"
          style={{
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            color: "var(--accent-fg)",
            padding: "5px 8px",
            fontSize: "11px",
            cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-jetbrains)",
            opacity: pending ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          save
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setName(currentName);
            setEditing(false);
          }}
          title="Cancel rename"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--muted)",
            padding: "5px 8px",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "var(--font-jetbrains)",
            whiteSpace: "nowrap",
          }}
        >
          cancel
        </button>
        {error && (
          <span
            role="status"
            style={{
              position: "absolute",
              top: "32px",
              left: 0,
              width: "220px",
              color: "var(--danger)",
              fontFamily: "var(--font-jetbrains)",
              fontSize: "10px",
            }}
          >
            {error}
          </span>
        )}
      </form>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
      <button
        onClick={() => {
          setError(null);
          setName(currentName);
          setEditing(true);
        }}
        disabled={pending}
        title="Rename page"
        style={{
          background: "transparent",
          border: "1px solid transparent",
          color: "var(--muted)",
          padding: "5px 8px",
          fontSize: "12px",
          cursor: pending ? "not-allowed" : "pointer",
          transition: "color 0.15s, border-color 0.15s",
          lineHeight: 1,
          fontFamily: "var(--font-jetbrains)",
          opacity: pending ? 0.5 : 1,
        }}
        onMouseOver={e => {
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.borderColor = "var(--border-hover)";
        }}
        onMouseOut={e => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        edit
      </button>
      {error && (
        <span
          role="status"
          style={{
            position: "absolute",
            top: "28px",
            right: 0,
            width: "180px",
            color: "var(--danger)",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "10px",
            textAlign: "right",
          }}
        >
          {error}
        </span>
      )}
    </span>
  );
}

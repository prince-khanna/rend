"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiToken = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [name, setName] = useState("Codex");
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTokens() {
      const response = await fetch("/api/v1/tokens");
      const body = await response.json().catch(() => null);
      if (!active) return;

      if (!response.ok) {
        setMessage({ type: "err", text: body?.error?.message ?? "Could not load API tokens." });
      } else {
        setTokens(body.tokens ?? []);
      }
      setLoading(false);
    }

    loadTokens();
    return () => {
      active = false;
    };
  }, []);

  async function createToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setRawToken(null);
    setMessage(null);

    const response = await fetch("/api/v1/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage({ type: "err", text: body?.error?.message ?? "Could not create API token." });
      return;
    }

    setTokens((current) => [body.token, ...current]);
    setRawToken(body.raw_token);
    setMessage({ type: "ok", text: "Token created. Copy it now; it will not be shown again." });
  }

  async function revokeToken(id: string) {
    const response = await fetch(`/api/v1/tokens/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage({ type: "err", text: body?.error?.message ?? "Could not revoke API token." });
      return;
    }

    setTokens((current) => current.filter((token) => token.id !== id));
    setMessage({ type: "ok", text: "Token revoked." });
  }

  return (
    <section style={{ marginBottom: "48px" }}>
      <h2 style={{
        fontFamily: "var(--font-jetbrains)",
        fontSize: "11px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid var(--border)",
      }}>
        API tokens
      </h2>

      <form onSubmit={createToken} style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "16px" }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>
            TOKEN NAME
          </span>
          <input
            className="input-base"
            value={name}
            maxLength={80}
            onChange={event => setName(event.target.value)}
            placeholder="Codex"
            required
          />
        </label>
        <button type="submit" disabled={saving} className="btn-accent" style={{ padding: "11px 16px", fontSize: "13px" }}>
          {saving ? "Creating..." : "Create"}
        </button>
      </form>

      {rawToken && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>
            NEW TOKEN
          </label>
          <textarea
            className="input-base"
            readOnly
            value={rawToken}
            rows={2}
            style={{ fontFamily: "var(--font-jetbrains)", resize: "vertical" }}
            onFocus={event => event.currentTarget.select()}
          />
        </div>
      )}

      {message && (
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "12px",
          color: message.type === "ok" ? "var(--accent)" : "var(--danger)",
          padding: "10px 12px",
          background: message.type === "ok" ? "rgba(226,247,64,0.06)" : "rgba(232,80,64,0.08)",
          border: `1px solid ${message.type === "ok" ? "rgba(226,247,64,0.2)" : "rgba(232,80,64,0.2)"}`,
          marginBottom: "16px",
        }}>
          {message.text}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {loading && (
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "12px", color: "var(--muted)" }}>Loading tokens...</p>
        )}
        {!loading && tokens.length === 0 && (
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "12px", color: "var(--muted)" }}>No API tokens yet.</p>
        )}
        {tokens.map((token) => (
          <div
            key={token.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              background: "var(--surface)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{token.name}</p>
              <p style={{ margin: "3px 0 0", fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)" }}>
                {token.token_prefix}... · created {formatDate(token.created_at)} · last used {formatDate(token.last_used_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => revokeToken(token.id)}
              style={{
                background: "transparent",
                border: "1px solid rgba(232,80,64,0.25)",
                color: "var(--danger)",
                padding: "6px 10px",
                fontFamily: "var(--font-jetbrains)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              revoke
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

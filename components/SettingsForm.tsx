"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { applyTheme, type Theme } from "@/lib/theme";

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: "dark",   label: "Dark",   desc: "Material blue on dark charcoal" },
  { value: "light",  label: "Light",  desc: "Light blue tonal" },
  { value: "system", label: "System", desc: "Follows your OS preference" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusMsg({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  const ok = msg.type === "ok";
  return (
    <p style={{
      fontFamily: "var(--font-jetbrains)",
      fontSize: "12px",
      color: ok ? "var(--accent)" : "var(--danger)",
      padding: "10px 12px",
      background: ok ? "var(--tonal-bg)" : "var(--surface2)",
      border: `1px solid ${ok ? "transparent" : "var(--border-hover)"}`,
      marginTop: "12px",
    }}>
      {msg.text}
    </p>
  );
}

type Props = { initialEmail: string; initialName: string; initialTheme: Theme };

export function SettingsForm({ initialEmail, initialName, initialTheme }: Props) {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initialName);
  const [nameMsg, setNameMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [nameSaving, setNameSaving]   = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSaving, setPwSaving]   = useState(false);

  const [activeTheme, setActiveTheme] = useState<Theme>(initialTheme);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    setNameSaving(false);
    setNameMsg(error ? { type: "err", text: error.message } : { type: "ok", text: "Name updated." });
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (newPw.length < 6)    { setPwMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
    setPwSaving(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: initialEmail, password: currentPw });
    if (signInError) { setPwSaving(false); setPwMsg({ type: "err", text: "Current password is incorrect." }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      setPwMsg({ type: "err", text: error.message });
    } else {
      setPwMsg({ type: "ok", text: "Password updated." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  async function handleThemeChange(t: Theme) {
    setActiveTheme(t);
    // Apply immediately to DOM
    applyTheme(t);
    localStorage.setItem("pigeon-theme", t);
    // Persist to Supabase so it loads correctly next session / other devices
    await supabase.auth.updateUser({ data: { theme: t } });
  }

  return (
    <div>
      {/* Profile */}
      <Section title="Profile">
        <form onSubmit={saveName} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>
              DISPLAY NAME
            </label>
            <input className="input-base" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>
              EMAIL
            </label>
            <input className="input-base" type="email" value={initialEmail} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <button type="submit" disabled={nameSaving} className="btn-accent" style={{ padding: "10px 20px", fontSize: "13px", alignSelf: "flex-start" }}>
            {nameSaving ? "Saving…" : "Save name"}
          </button>
          <StatusMsg msg={nameMsg} />
        </form>
      </Section>

      {/* Password */}
      <Section title="Password">
        <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {([
            ["CURRENT PASSWORD", currentPw, setCurrentPw],
            ["NEW PASSWORD",     newPw,     setNewPw],
            ["CONFIRM PASSWORD", confirmPw, setConfirmPw],
          ] as [string, string, (v: string) => void][]).map(([label, value, set]) => (
            <div key={label}>
              <label style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>
                {label}
              </label>
              <input className="input-base" type="password" value={value} onChange={e => set(e.target.value)} required />
            </div>
          ))}
          <button type="submit" disabled={pwSaving} className="btn-accent" style={{ padding: "10px 20px", fontSize: "13px", alignSelf: "flex-start" }}>
            {pwSaving ? "Updating…" : "Update password"}
          </button>
          <StatusMsg msg={pwMsg} />
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {THEMES.map(({ value, label, desc }) => {
            const active = activeTheme === value;
            return (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
                  background: active ? "var(--surface2)" : "var(--surface)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  width: "100%",
                }}
              >
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: active ? "var(--accent)" : "var(--border-hover)",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: 0 }}>{label}</p>
                  <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)", margin: "2px 0 0" }}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

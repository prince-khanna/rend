"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const inputStyle = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "12px 14px",
  fontSize: "14px",
  outline: "none",
  fontFamily: "var(--font-syne)",
  borderRadius: "var(--radius-sm)",
  transition: "border-color var(--duration-fast) var(--ease-fluid), box-shadow var(--duration-fast) var(--ease-fluid)",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) { setError(error.message); return; }
    if (!data.session) {
      setError("Check your email to confirm your account before signing in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <header style={{ padding: "24px 40px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 800,
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text)",
          textDecoration: "none",
        }}>
          <img src="/icon.png" alt="" width="28" height="28" style={{ borderRadius: "7px", display: "block" }} />
          Pigeon
        </Link>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div className="animate-fade-up" style={{ width: "100%", maxWidth: "360px" }}>
          {/* Heading */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </p>
            <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.02em" }}>
              {mode === "login" ? "Sign in" : "Get started"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px oklch(93% 0.21 114 / 0.12)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px oklch(93% 0.21 114 / 0.12)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            />

            {error && (
              <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "12px", color: "var(--danger)", padding: "10px 12px", background: "rgba(232,80,64,0.08)", border: "1px solid rgba(232,80,64,0.2)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-syne)",
                borderRadius: "var(--radius-md)",
                transition: "opacity var(--duration-fast) var(--ease-fluid), transform var(--duration-fast) var(--ease-fluid), box-shadow var(--duration-std) var(--ease-fluid)",
                marginTop: "4px",
              }}
            >
              {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>
            {mode === "login" ? "No account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-syne)" }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

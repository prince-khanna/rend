import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        padding: "16px clamp(16px, 4vw, 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <img src="/icon.png" alt="" width="28" height="28" style={{ borderRadius: "7px", display: "block" }} />
          Pigeon
        </span>
        <Link href="/login" className="link-muted" style={{ fontSize: "13px" }}>
          Sign in →
        </Link>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(40px, 8vw, 80px) clamp(20px, 5vw, 40px)",
        textAlign: "center",
      }}>
        <div className="animate-fade-up" style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "11px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "28px",
          padding: "6px 12px",
          border: "1px solid var(--accent)",
          display: "inline-block",
        }}>
          HTML & Markdown Hosting
        </div>

        <img
          className="animate-fade-up animate-fade-up-1"
          src="/icon.png"
          alt=""
          width="112"
          height="112"
          style={{
            borderRadius: "24px",
            display: "block",
            marginBottom: "28px",
          }}
        />

        <h1 className="animate-fade-up animate-fade-up-2" style={{
          fontWeight: 800,
          fontSize: "clamp(64px, 12vw, 140px)",
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          marginBottom: "36px",
        }}>
          Pigeon
        </h1>

        <p className="animate-fade-up animate-fade-up-3" style={{
          fontSize: "17px",
          color: "var(--muted)",
          maxWidth: "380px",
          lineHeight: 1.6,
          marginBottom: "48px",
        }}>
          Upload an HTML or Markdown file. Get a link. Share it with anyone — no setup, no server.
        </p>

        <div className="animate-fade-up animate-fade-up-3">
          <Link href="/login" className="btn-accent" style={{ padding: "12px 28px", fontSize: "14px" }}>
            Get started
          </Link>
        </div>
      </main>

      <footer style={{
        padding: "16px clamp(16px, 4vw, 40px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)" }}>.html · .md → URL</span>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "11px", color: "var(--muted)" }}>5MB max · public by default</span>
      </footer>
    </div>
  );
}

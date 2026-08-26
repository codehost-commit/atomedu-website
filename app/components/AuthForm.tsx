"use client";
import { useState } from "react";

export function AuthForm({
  next,
  startSignup = false,
}: {
  next: string;
  startSignup?: boolean;
}) {
  const [signup, setSignup] = useState(startSignup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = next && next.startsWith("/") ? next : "/";

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      window.location.href = dest;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <style>{`
 .auth-card{max-width:400px;margin:0 auto;border:1px solid var(--line);background:#fff;padding:32px}
 .auth-card h1{font-size:30px;letter-spacing:0;margin:0 0 4px}
 .auth-card>p.sub{font-size:13px;color:var(--muted);margin:0 0 22px}
 .auth-tabs{display:flex;border:1px solid var(--line);margin-bottom:22px}
 .auth-tabs button{flex:1;border:0;background:#fff;padding:10px;font:600 12px "DM Sans";color:var(--muted);cursor:pointer}
 .auth-tabs button.on{background:var(--ink);color:#fff}
 .auth-card label{display:block;font:500 10px "DM Mono";letter-spacing:.5px;color:#58615b;margin:0 0 6px}
 .auth-card input{display:block;width:100%;border:1px solid #bfc4bc;background:#fff;padding:11px;font:500 13px "DM Sans";color:var(--ink);margin-bottom:15px}
 .auth-card input:focus{outline:2px solid var(--blue);outline-offset:-2px}
 .auth-card.submit{width:100%;border:0;background:var(--blue);color:#fff;padding:12px;font:600 13px "DM Sans";cursor:pointer}
 .auth-card.submit:disabled{opacity:.6;cursor:default}
 .auth-toggle{text-align:center;font-size:12px;color:var(--muted);margin:16px 0 0}
 .auth-toggle button{border:0;background:none;color:var(--blue);font:600 12px "DM Sans";cursor:pointer;padding:0}
 .auth-msg{font-size:12px;line-height:1.5;padding:11px 13px;margin:0 0 15px;border:1px solid}
 .auth-msg.err{color:#7f2114;background:#fdeeeb;border-color:#f3c7bf}
 .auth-msg.ok{color:#1f5340;background:#eef6f1;border-color:#c4e0d3}
 .auth-devlink{display:block;font:500 12px "DM Mono";color:var(--blue);word-break:break-all;margin-top:8px}
 .auth-hint{font-size:11px;color:var(--muted);line-height:1.5;margin:14px 0 0}
 `}</style>

      <h1>
        {signup ? "Create your account" : "Sign in"}
      </h1>
      <p className="sub">Use your email and a password. No credit card needed.</p>

      {error && <p className="auth-msg err">{error}</p>}
      <form onSubmit={submitPassword}>
        {signup && (
          <>
            <label htmlFor="name">Name (optional)</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </>
        )}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} />
        <button className="submit" type="submit" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
        <p className="auth-toggle">
          {signup ? "Already have an account? " : "New to Atom Edu? "}
          <button type="button" onClick={() => { setSignup((v) => !v); setError(null); }}>
            {signup ? "Sign in" : "Create one"}
          </button>
        </p>
      </form>
    </div>
  );
}

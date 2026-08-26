"use client";
import { useState } from "react";
import type { PublicSettings } from "../lib/settings";

export function SettingsForm({ initial }: { initial: PublicSettings }) {
  const [provider, setProvider] = useState(initial.provider);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(initial.hasKey);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, baseUrl, model, apiKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Failed to save." });
        return;
      }
      if (apiKey.trim()) setHasKey(true);
      setApiKey("");
      setMsg({ ok: true, text: "Settings saved." });
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (res.ok) {
        setHasKey(false);
        setMsg({ ok: true, text: "Your key was removed." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} style={{ maxWidth: "560px" }}>
      {msg && (
        <p
          className={`note ${msg.ok ? "note-ok" : "note-err"}`}
          style={{ marginBottom: "18px" }}
        >
          {msg.text}
        </p>
      )}

      <div className="note note-info" style={{ marginBottom: "22px" }}>
        {hasKey
          ? "Your AI key is saved and encrypted. Generation uses your key. Leave the key field blank to keep it; enter a new one to replace it."
          : "No key saved, you're on the free shared Groq allowance. Add an OpenAI-compatible key for unlimited, private generation. Your key is encrypted and never shown again."}
      </div>

      <div className="field">
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="groq">Groq</option>
          <option value="openai">OpenAI-compatible</option>
        </select>
        <p className="hint">
          Groq uses the OpenAI-compatible chat completions API. OpenRouter,
          Together, and local servers can also work when their base URL and model match.
        </p>
      </div>
      <div className="field">
        <label htmlFor="baseUrl">API base URL</label>
        <input
          id="baseUrl"
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.groq.com/openai/v1"
        />
      </div>
      <div className="field">
        <label htmlFor="model">Model</label>
        <input
          id="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="openai/gpt-oss-120b"
        />
      </div>
      <div className="field">
        <label htmlFor="apiKey">
          API key{" "}
          {hasKey && <span style={{ color: "var(--green)" }}>· saved</span>}
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? "•••••••• (leave blank to keep)" : "gsk_..."}
          autoComplete="off"
        />
        <p className="hint">
          Stored encrypted on the server and used only to generate your
          materials. Never sent to anyone else, never shown again.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save settings"}
        </button>
        {hasKey && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={clear}
            disabled={busy}
          >
            Remove key
          </button>
        )}
      </div>
    </form>
  );
}

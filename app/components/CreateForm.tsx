"use client";
import { useMemo, useState } from "react";
import { WorksheetPreview } from "./MathText";

const kinds = [
  "Worksheet",
  "Assignment",
  "Quiz",
  "Unit review",
  "Lab handout",
  "Exit ticket",
  "Rubric",
];

type GenerateResponse = {
  error?: string;
  content?: string;
  usingOwnKey?: boolean;
  signedIn?: boolean;
  canDownload?: boolean;
  remainingToday?: number;
  limit?: number;
};

export function CreateForm({
  signedIn = true,
  compact = false,
}: {
  signedIn?: boolean;
  compact?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [grade, setGrade] = useState("");
  const [kind, setKind] = useState("Worksheet");
  const [details, setDetails] = useState("");
  const [diagrams, setDiagrams] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [ownKey, setOwnKey] = useState(false);
  const [canDownload, setCanDownload] = useState(signedIn);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const formTitle = useMemo(() => {
    if (prompt.trim()) return prompt.trim().split("\n")[0].slice(0, 80);
    return `${grade || "Class"} ${kind}`;
  }, [grade, kind, prompt]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setContent(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, grade, kind, details, diagrams }),
      });
      const data = (await res.json().catch(() => ({}))) as GenerateResponse;
      if (!res.ok || !data.content) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setContent(data.content);
      setOwnKey(Boolean(data.usingOwnKey));
      setCanDownload(Boolean(data.canDownload));
      setRemainingToday(typeof data.remainingToday === "number" ? data.remainingToday : null);
      setTitle(formTitle);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!content) return;
    setSaveMsg(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "Untitled",
        kind,
        prompt,
        content,
      }),
    });
    setSaveMsg(res.ok ? "Saved to your library." : "Couldn't save.");
  }

  async function downloadPdf() {
    if (!content) return;
    setDownloading(true);
    setSaveMsg(null);
    try {
      const paper = document.querySelector<HTMLElement>(".worksheet-paper");
      const printWindow = window.open("", "_blank");
      if (!paper || !printWindow) {
        setSaveMsg("Allow pop-ups to save this PDF.");
        return;
      }
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title></title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.4/dist/katex.min.css"><style>body{margin:0;background:#fff;color:#14231e;font-family:Arial,sans-serif}.worksheet-paper{margin:0 auto;max-width:7.2in;padding:.55in;font-size:11pt;line-height:1.55}.worksheet-line{margin:0 0 4pt;white-space:pre-wrap}.worksheet-gap{height:10pt}.worksheet-heading{font-weight:700;line-height:1.25;margin:0 0 8pt}.worksheet-heading-1{font-size:18pt;border-bottom:1px solid #9aa5a0;padding-bottom:10pt}.worksheet-heading-2{font-size:14pt;margin-top:14pt}.worksheet-heading-3{font-size:12pt;margin-top:10pt}.math-inline{display:inline-block}.math-display{display:block;margin:10pt 0;text-align:center}@page{size:letter;margin:.25in}@media print{.worksheet-paper{padding:0;max-width:none}}</style></head><body>${paper.outerHTML}</body></html>`);
      printWindow.document.title = title || formTitle || "Atom Edu Assignment";
      printWindow.document.close();
      printWindow.addEventListener("load", () => {
        window.setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      }, { once: true });
      setSaveMsg("Choose Save as PDF in the print window.");
    } finally {
      setDownloading(false);
    }
  }

  function copy() {
    if (content)
      navigator.clipboard?.writeText(content).then(
        () => setSaveMsg("Copied to clipboard."),
        () => {},
      );
  }

  return (
    <div className={content ? "creator creator-has-output" : "creator"}>
      <form className="creator-panel" onSubmit={run}>
        {error && <p className="note note-err">{error}</p>}

        <div className="field">
          <label htmlFor="prompt">Assignment topic</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Calculus worksheet on derivatives and antiderivatives with 8 MCQs, 4 short answer, and 1 graph analysis FRQ."
            required
            style={{ minHeight: compact ? "110px" : "140px" }}
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="grade">Class</label>
            <input
              id="grade"
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="AP Calculus AB"
            />
          </div>
          <div className="field">
            <label htmlFor="kind">Paper type</label>
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              {kinds.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="details">Counts and details</label>
          <input
            id="details"
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="12 questions, mixed difficulty, answer key, 20 points total"
          />
        </div>

        <div className="field">
          <label htmlFor="diagrams">Diagrams</label>
          <input
            id="diagrams"
            type="text"
            value={diagrams}
            onChange={(e) => setDiagrams(e.target.value)}
            placeholder="Include one labeled graph of a piecewise function; exact axis labels and intercepts"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Building worksheet..." : signedIn ? "Generate worksheet" : "Try one free preview"}
        </button>

        <p className="hint">
          {signedIn
            ? "Teachers can make 5 assignments per day on the shared free Groq allowance."
            : "Preview once without an account. Sign in to download the generated PDF."}
        </p>
      </form>

      <section className="worksheet-output" aria-live="polite">
        {content ? (
          <>
            <div className="output-toolbar">
              <div>
                <p className="kicker">Worksheet preview</p>
                <p className="toolbar-note">
                  {ownKey ? "Using your key" : "Using Atom Edu free AI"}
                  {remainingToday !== null ? ` · ${remainingToday} left today` : ""}
                </p>
              </div>
              <div className="toolbar-actions">
                <button className="btn btn-ghost btn-sm" type="button" onClick={copy}>Copy</button>
                {canDownload ? (
                  <>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={save}>Save</button>
                    <button className="btn btn-ink btn-sm" type="button" onClick={downloadPdf} disabled={downloading}>
                      {downloading ? "Opening..." : "Save PDF"}
                    </button>
                  </>
                ) : (
                  <a className="btn btn-ink btn-sm" href="/login?mode=signup&next=/create">
                    Sign in to download
                  </a>
                )}
              </div>
            </div>
            {saveMsg && <p className="note note-ok">{saveMsg}</p>}
            <div className="field">
              <label htmlFor="title">PDF title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <WorksheetPreview content={content} />
          </>
        ) : (
          <div className="empty-paper">
            <p className="kicker">Live PDF preview</p>
            <h3>Atom will generate the full paper here.</h3>
            <p>
              Title, Name/Date/Period, directions, questions, answer key, properly typeset notation,
              and clear diagram instructions are included in the draft.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

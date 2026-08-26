import { resolveApiKey, resolveSharedApiKey } from "./settings";

export type GenInput = { prompt: string; grade?: string; kind?: string; details?: string; diagrams?: string };
export type GenResult = { ok: true; content: string; usingOwnKey: boolean } | { ok: false; error: string };

const SYSTEM = `You are Atom Edu, a teacher-first worksheet engine.
Output only polished Markdown for a printable worksheet. Use LaTeX for all math, chemistry, and physics notation:
inline as \\(...\\), display equations as \\[...\\].
No raw caret math like x^2 outside LaTeX. No markdown code fences.
Every worksheet must include a title, Name/Date/Period line, concise directions, numbered items, point values, and an answer key.
When a diagram is needed, include a compact DIAGRAM SPEC block with exact labels, axes, values, curves, arrows, or shapes.
Diagrams must be simple, labeled, classroom-printable, and geometry-specific, not decorative.
The teacher reviews, edits, and approves all output.`;

const OPTIMIZER_SYSTEM = `Compress teacher requests into a precise worksheet brief.
Keep only requirements needed to generate the worksheet. Preserve grade, topic, counts, standards, question mix, diagram needs, and formatting constraints.
Return 90 words or fewer.`;

function userPrompt(input: GenInput): string {
  const bits = [`Teacher request: ${input.prompt.trim()}`];
  if (input.grade) bits.push(`Class/grade: ${input.grade}.`);
  if (input.kind) bits.push(`Format: ${input.kind}.`);
  if (input.details?.trim()) bits.push(`Details: ${input.details.trim()}`);
  if (input.diagrams?.trim()) bits.push(`Diagram requirements: ${input.diagrams.trim()}`);
  bits.push(`Generate the final worksheet now.
Quality rules:
- Use LaTeX for every formula, unit expression, chemical equation, isotope, vector, integral, derivative, graph function, and variable expression.
- Multiple choice items need four plausible choices labeled A-D.
- Short answer and FRQ items need enough blank space markers like "Answer: ________________________________".
- Diagram specs must state canvas subject, labels, coordinates/relationships, and what students should inspect.
- Keep the worksheet print-ready on US Letter paper.`);
  return bits.join("\n");
}

async function callChat(args: {
  key: string;
  baseUrl: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const res = await fetch(`${args.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.model,
      temperature: args.temperature,
      max_tokens: args.maxTokens,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.prompt },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: `AI provider returned ${res.status}. ${detail.slice(0, 200)}` };
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) return { ok: false, error: "The AI returned an empty response. Try again." };
  return { ok: true, content };
}

async function optimizeBrief(args: {
  key: string;
  baseUrl: string;
  optimizerModel: string;
  input: GenInput;
}): Promise<string | null> {
  const raw = [
    args.input.prompt,
    args.input.grade ? `Class/grade: ${args.input.grade}` : "",
    args.input.kind ? `Format: ${args.input.kind}` : "",
    args.input.details ? `Details: ${args.input.details}` : "",
    args.input.diagrams ? `Diagrams: ${args.input.diagrams}` : "",
  ].filter(Boolean).join("\n");
  const result = await callChat({
    key: args.key,
    baseUrl: args.baseUrl,
    model: args.optimizerModel,
    system: OPTIMIZER_SYSTEM,
    prompt: raw,
    maxTokens: 180,
    temperature: 0.1,
  }).catch(() => null);
  return result?.ok ? result.content : null;
}

export async function generate(userId: string | null, input: GenInput): Promise<GenResult> {
  if (!input.prompt.trim()) return { ok: false, error: "Describe what you'd like Atom to draft." };

  const shared = userId ? null : resolveSharedApiKey();
  const resolved = userId ? await resolveApiKey(userId) : {
    key: shared?.key ?? null,
    usingOwnKey: false,
    baseUrl: shared?.baseUrl ?? "https://api.groq.com/openai/v1",
    model: shared?.model ?? "openai/gpt-oss-120b",
  };
  const { key, usingOwnKey, baseUrl, model } = resolved;
  if (!key) {
    return { ok: false, error: "No Groq key is set up yet. Add GROQ_API_KEY in Cloudflare secrets to enable generation." };
  }

  try {
    const optimizerModel = userId ? resolveSharedApiKey().optimizerModel : shared?.optimizerModel;
    const brief = optimizerModel ? await optimizeBrief({ key, baseUrl, optimizerModel, input }) : null;
    const result = await callChat({
      key,
      baseUrl,
      model,
      system: SYSTEM,
      prompt: userPrompt({ ...input, prompt: brief ?? input.prompt }),
      maxTokens: 3600,
      temperature: 0.25,
    });
    if (!result.ok) return result;
    return { ok: true, content: result.content, usingOwnKey };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

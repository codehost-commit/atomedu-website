import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { requireUser } from "../lib/auth";
import { getPublicSettings } from "../lib/settings";
import { listAssignments } from "../lib/assignments";

const quick: [string, string, string][] = [
  [
    "New assignment",
    "/create",
    "Draft homework, a quiz, or a task from a prompt.",
  ],
  ["Grading", "/grading", "Review work by criterion and prepare feedback."],
  ["Assessment", "/assessment", "Build quizzes, prompts, and answer keys."],
  ["Library", "/library", "Your rubrics, comment banks, and templates."],
  ["Messages", "/messages", "Draft careful messages home."],
  ["Settings", "/settings", "Connect your AI key and preferences."],
];

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const [settings, recent] = await Promise.all([
    getPublicSettings(user.id),
    listAssignments(user.id, 6),
  ]);
  const first = (user.name ?? user.email).split(/[@\s]/)[0];

  return (
    <main>
      <Nav current="Dashboard" />
      <section className="container page-head">
        <p className="kicker">Your workspace</p>
        <h1>Welcome back, {first}.</h1>
        <p className="lead">
          Everything here is a draft until you approve it. Start something new,
          or pick up where you left off.
        </p>
      </section>

      <section className="container section-sm">
        {!settings.hasKey && (
          <div
            className="note note-info"
            style={{
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>
              You&apos;re on the free shared allowance. Add your own AI key for
              unlimited, private generation.
            </span>
            <a className="btn btn-ghost btn-sm" href="/settings">
              Add your key
            </a>
          </div>
        )}
        <div className="grid grid-3">
          {quick.map(([label, href, desc]) => (
            <a
              key={href}
              className="cell"
              href={href}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div className="k">Open</div>
              <h3>{label}</h3>
              <p>{desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="container section-sm divider-top">
        <div className="sec-head" style={{ marginBottom: "24px" }}>
          <p className="kicker">Recent work</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,34px)" }}>Saved drafts</h2>
        </div>
        {recent.length === 0 ? (
          <div className="note note-info">
            Nothing saved yet.{" "}
            <a href="/create">Create your first assignment</a>
          </div>
        ) : (
          <div className="cards">
            {recent.map((a) => (
              <div
                className="card"
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "17px" }}>{a.title}</h3>
                  <p
                    style={{
                      marginTop: "5px",
                      fontFamily: "DM Mono, monospace",
                      fontSize: "11px",
                      letterSpacing: ".5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {a.kind} · {a.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { RouteList } from "./RouteList";
import { requireUser } from "../lib/auth";

const pageInfo: Record<
  string,
  {
    kicker: string;
    title: string;
    description: string;
    primary: string;
    rows: [string, string, string][];
  }
> = {
  Assignments: {
    kicker: "ASSIGNMENT WORKSPACE",
    title: "Build the brief before the bell.",
    description:
      "Create, review, and save assignments with the rubric, materials, and directions in one teacher-owned draft.",
    primary: "New assignment",
    rows: [
      ["Argument Writing Reflection", "English 9 · Draft", "Open"],
      ["Independent Reading Check", "English 10 · Scheduled Friday", "Open"],
      ["Revision Studio", "English 10 · Template", "Open"],
    ],
  },
  Grading: {
    kicker: "GRADING DESK",
    title: "Review evidence. Award the point.",
    description:
      "Start with your rubric and your calibration set. Atom prepares the work; you decide every score and comment.",
    primary: "Start review",
    rows: [
      [
        "Argument Writing Reflection",
        "28 submissions · 4 need judgment",
        "Review",
      ],
      ["Lab Report: Motion", "14 submissions · rubric attached", "Review"],
      [
        "Reading Conference Notes",
        "12 records · draft feedback ready",
        "Review",
      ],
    ],
  },
  Assessment: {
    kicker: "ASSESSMENT STUDIO",
    title: "Make the next check count.",
    description:
      "Build quizzes, prompts, alternate forms, answer keys, and point maps. Run a clarity check before anything is published.",
    primary: "New assessment",
    rows: [
      ["Claim and Evidence Quiz", "12 questions · draft", "Edit"],
      ["Rhetorical Analysis Prompt", "Writing task · rubric attached", "Edit"],
      ["Revision Exit Ticket", "5 questions · saved template", "Edit"],
    ],
  },
  Library: {
    kicker: "TEACHER ASSET LIBRARY",
    title: "Keep the work worth keeping.",
    description:
      "Your approved rubrics, comment banks, family messages, exemplars, and templates stay ready for the next course or unit.",
    primary: "Add asset",
    rows: [
      ["Argument Writing Rubric", "Rubric · updated today", "Open"],
      ["Constructive feedback bank", "Comments · 42 entries", "Open"],
      ["Family progress update", "Message template · approved", "Open"],
    ],
  },
  Messages: {
    kicker: "MESSAGE DRAFTS",
    title: "Write it once. Review it before it goes.",
    description:
      "Prepare clear, factual family communication from teacher-selected details. Nothing is ever sent automatically.",
    primary: "New message",
    rows: [
      ["Revision opportunity", "Draft · English 9", "Edit"],
      ["Missing work follow-up", "Draft · needs facts", "Edit"],
      ["Progress update", "Template · saved", "Edit"],
    ],
  },
};

const pagePaths: Record<string, string> = {
  Assignments: "/assignments",
  Grading: "/grading",
  Assessment: "/assessment",
  Library: "/library",
  Messages: "/messages",
};

export async function RoutePage({ page }: { page: keyof typeof pageInfo }) {
  await requireUser(pagePaths[page] ?? "/");
  const info = pageInfo[page];
  return (
    <main>
      <style>{`.route-hero,.route-content{max-width:1180px;margin:auto;padding-left:28px;padding-right:28px}.route-hero{padding-top:100px;padding-bottom:60px;border-bottom:1px solid var(--ink)}.route-hero h1{font-size:clamp(48px,6vw,82px);letter-spacing:0;line-height:.98;margin:0;max-width:720px}.route-hero>p:not(.kicker){max-width:560px;font-size:16px;line-height:1.55;margin:27px 0 0}.route-content{padding-top:32px;padding-bottom:110px}.route-note{display:flex;gap:15px;border:1px solid var(--line);padding:14px 16px;background:#fbfaf6;font-size:11px;margin-bottom:19px}.route-note span{color:var(--muted)}.route-list{border-top:1px solid var(--ink)}.route-list article{display:flex;justify-content:space-between;align-items:center;padding:26px 0}.route-list>div{border-bottom:1px solid var(--line)}.route-list h2{font-size:23px;letter-spacing:0;margin:0}.route-list p{font-size:12px;color:var(--muted);margin:7px 0 0}.route-list article button{border:0;background:var(--ink);color:#fff;padding:11px 16px;font:600 12px "DM Sans";cursor:pointer}@media(max-width:700px){.route-hero{padding-top:65px}.route-list article{gap:18px}.route-list h2{font-size:18px}}`}</style>
      <Nav current={page} />
      <section className="route-hero">
        <p className="kicker">{info.kicker}</p>
        <h1>{info.title}</h1>
        <p>{info.description}</p>
      </section>
      <section className="route-content">
        <div className="route-note">
          <b>Teacher approval required</b>
          <span>All drafts are private until you decide otherwise.</span>
        </div>
        <RouteList
          rows={info.rows.map(([title, meta, action]) => ({
            title,
            meta,
            action,
          }))}
          primary={info.primary}
        />
      </section>
      <Footer />
    </main>
  );
}

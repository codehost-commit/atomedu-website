import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";

export default function FeaturesPage() {
  return (
    <main>
      <Nav current="Features" />
      <section className="container page-head">
        <p className="kicker">Features</p>
        <h1>Everything a teacher needs. Nothing to unlock.</h1>
        <p className="lead">
          Atom Edu covers the work around teaching, writing tasks, building
          assessments, reviewing a full stack of work, and communicating with
          families. Every feature below is free, for every teacher.
        </p>
      </section>

      <section className="container section">
        <div className="grid grid-2">
          <article className="cell">
            <div className="k">Create</div>
            <h3>Assignment builder</h3>
            <p>
              Describe what you need: grade, topic, standard, and length. Atom
              drafts an assignment with directions, questions, and an answer key
              you can edit before anyone sees it.
            </p>
          </article>
          <article className="cell">
            <div className="k">Rubrics</div>
            <h3>Rubric-first</h3>
            <p>
              Build or attach a rubric and keep every draft tied to it, so
              expectations are explicit and grading later has something to stand
              on.
            </p>
          </article>
          <article className="cell">
            <div className="k">Grading</div>
            <h3>Evidence-based review</h3>
            <p>
              Work is organized by criterion with the relevant evidence in view.
              Atom prepares comments; you award every point and decide every
              return.
            </p>
          </article>
          <article className="cell">
            <div className="k">Assessments</div>
            <h3>Quizzes &amp; alternate forms</h3>
            <p>
              Generate quizzes, prompts, answer keys, alternate forms, and point
              maps, with a clarity check before an assessment reaches anyone.
            </p>
          </article>
          <article className="cell">
            <div className="k">Differentiation</div>
            <h3>Meet the whole class</h3>
            <p>
              Produce leveled versions and accommodation-aware variants,
              simplified language, extended-time forms, from a single task.
            </p>
          </article>
          <article className="cell">
            <div className="k">Library</div>
            <h3>Keep what works</h3>
            <p>
              Approved rubrics, comment banks, exemplars, and templates stay
              ready for the next unit, saved and reusable.
            </p>
          </article>
          <article className="cell">
            <div className="k">Messages</div>
            <h3>Careful family communication</h3>
            <p>
              Draft factual messages home from details you select, with
              translation for multilingual families. Nothing sends
              automatically.
            </p>
          </article>
          <article className="cell">
            <div className="k">Your AI, your key</div>
            <h3>Bring your own key</h3>
            <p>
              Connect your own AI provider in Settings for unlimited, private
              generation, or use the free shared allowance to start.
            </p>
          </article>
        </div>
      </section>

      <section className="band">
        <div className="container section-sm" style={{ textAlign: "center" }}>
          <h2 style={{ maxWidth: "22ch", margin: "0 auto" }}>
            All of it, free. Start with one assignment.
          </h2>
          <div
            className="hero-cta"
            style={{ justifyContent: "center", marginTop: "24px" }}
          >
            <a className="btn btn-primary" href="/login?mode=signup">
              Get started free
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

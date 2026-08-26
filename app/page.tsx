import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { Logo } from "./components/Logo";

export default function Home() {
  return (
    <main>
      <Nav current="Home" />

      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-copy">
            <p className="kicker">Free tools for teachers</p>
            <h1>Make the next assignment without starting from scratch.</h1>
            <p className="lead">
              Tell Atom what your class needs. It prepares a printable draft with
              questions, answer key, student details, and readable STEM notation.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="/login?mode=signup">Create an account</a>
              <a className="btn btn-ghost" href="/use">See how it works</a>
            </div>
            <p className="hero-note">Free for teachers. No trial and no credit card.</p>
          </div>

          <div className="home-sheet" aria-label="Example Atom Edu worksheet">
            <div className="home-sheet-top">
              <Logo compact />
              <span>Student copy</span>
            </div>
            <div className="home-sheet-body">
              <h2>Rate of Change</h2>
              <div className="student-line">Name __________________  Date __________  Period _____</div>
              <p className="sheet-directions">Directions: Complete each question. Show your work.</p>
              <div className="sheet-question">
                <b>1. (1 point) Multiple choice</b>
                <p>Which expression is the derivative of <span className="sheet-math">f(x) = 3x² - 4x + 1</span>?</p>
                <ol className="sheet-options"><li>6x - 4</li><li>3x - 4</li><li>x³ - 2x² + x</li><li>6x + 4</li></ol>
              </div>
              <div className="sheet-question">
                <b>2. (2 points) Short answer</b>
                <p>Evaluate <span className="sheet-math">∫(2x + 3) dx</span>.</p>
                <div className="sheet-answer-lines"><i /><i /></div>
              </div>
              <div className="sheet-chart" aria-hidden="true"><span>y</span><strong>x</strong><i /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section home-steps">
        <div className="sec-head">
          <p className="kicker">Built for the real task</p>
          <h2>From a class goal to a ready-to-print PDF.</h2>
        </div>
        <div className="grid grid-3">
          <article className="cell"><div className="k">01</div><h3>Set the brief</h3><p>Choose the class, topic, question types, difficulty, and diagrams you need.</p></article>
          <article className="cell"><div className="k">02</div><h3>Review the draft</h3><p>Check every question and answer before it reaches your students.</p></article>
          <article className="cell"><div className="k">03</div><h3>Download the PDF</h3><p>Save assignments to your account and download a student-ready paper.</p></article>
        </div>
      </section>

      <section className="home-commitment">
        <div className="container commitment-grid">
          <div><p className="kicker">The commitment</p><h2>Teacher tools should not take a teacher budget.</h2></div>
          <p>Atom Edu is free for teachers. We do not sell classroom work or put ads in the product. You remain responsible for reviewing every assignment before use.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { CreateForm } from "./components/CreateForm";

export default function Home() {
  return (
    <main>
      <Nav current="Home" />

      <section className="product-hero">
        <div className="container product-hero-grid">
          <div className="hero-copy">
            <p className="kicker">
              <span className="badge badge-free badge-dot">100% free for teachers</span>
            </p>
            <h1>Printable assignments from a rough idea.</h1>
            <p className="lead">
              Atom Edu turns a teacher&apos;s prompt into a clean worksheet with
              questions, answer keys, LaTeX notation, diagram specs, and PDF export.
              Try one AI preview before signing in.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#try">Try the AI preview</a>
              <a className="btn btn-ghost" href="/login?mode=signup">Create free account</a>
            </div>
            <div className="metric-strip">
              <span><b>1</b> free preview</span>
              <span><b>5</b> assignments/day</span>
              <span><b>$0</b> forever</span>
            </div>
          </div>
          <div className="hero-sample" aria-hidden="true">
            <div className="sample-page">
              <div className="sample-head">
                <b>AP Chemistry: Reaction Rates</b>
                <span>Name: __________ Date: ______ Period: ___</span>
              </div>
              <p>Directions: Show work. Use correct units and significant figures.</p>
              <ol>
                <li>{"Balance \\(\\mathrm{N_2 + H_2 \\rightarrow NH_3}\\)."}</li>
                <li>{"Compute rate from \\(\\Delta[\\mathrm{NO_2}] / \\Delta t\\)."}</li>
                <li>Use the labeled graph to estimate instantaneous rate.</li>
              </ol>
              <div className="sample-diagram">
                <span>Concentration</span>
                <i />
                <strong>time</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="try" className="container section-sm">
        <div className="sec-head">
          <p className="kicker">Try it now</p>
          <h2>One free AI preview, no account.</h2>
          <p className="lead">
            Downloading the PDF and saving to your library require sign-in, but
            the first preview is open so teachers can see the quality first.
          </p>
        </div>
        <CreateForm signedIn={false} compact />
      </section>

      <section className="band">
        <div className="container section-sm">
          <div className="band-grid">
            <div>
              <p className="kicker">What changed</p>
              <h2>Atom Edu is an assignment workbench now.</h2>
            </div>
            <p className="lead">
              The site is centered on the real teacher workflow: generate,
              inspect, save, download, and reuse. The AI does the first draft;
              the teacher keeps the final judgment.
            </p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid grid-3">
          <article className="cell">
            <div className="k">01</div>
            <h3>Worksheet PDFs</h3>
            <p>
              The generator produces classroom-ready structure: title, student
              info line, directions, point values, mixed question types, and answer key.
            </p>
          </article>
          <article className="cell">
            <div className="k">02</div>
            <h3>Clean STEM formatting</h3>
            <p>
              Math, chemistry, and physics notation is requested in LaTeX, so
              equations stay readable instead of turning into raw caret text.
            </p>
          </article>
          <article className="cell">
            <div className="k">03</div>
            <h3>Better diagrams</h3>
            <p>
              Atom asks for exact diagram specs: axes, labels, values, arrows,
              geometry, and what students should inspect.
            </p>
          </article>
          <article className="cell">
            <div className="k">04</div>
            <h3>Teacher accounts</h3>
            <p>
              Email and password accounts keep saved assignments private and
              unlock PDF downloads.
            </p>
          </article>
          <article className="cell">
            <div className="k">05</div>
            <h3>Free shared allowance</h3>
            <p>
              Signed-in teachers get 5 shared-AI assignment generations per UTC
              day, enough for real trial usage without runaway API cost.
            </p>
          </article>
          <article className="cell">
            <div className="k">06</div>
            <h3>Bring your own key later</h3>
            <p>
              The settings page still supports encrypted provider keys, so power
              users can move beyond the shared limit without Atom charging teachers.
            </p>
          </article>
        </div>
      </section>

      <section className="container section divider-top">
        <div className="promise">
          <div className="row">
            <span className="i">Free</span>
            <h3>No teacher paywall</h3>
            <p>Atom Edu is designed around grants, sponsored compute, and optional bring-your-own-key usage.</p>
          </div>
          <div className="row">
            <span className="i">Private</span>
            <h3>No automatic sharing</h3>
            <p>Assignments are drafts until the teacher decides they are ready to use.</p>
          </div>
          <div className="row">
            <span className="i">Useful</span>
            <h3>The first screen is the tool</h3>
            <p>The homepage now starts with the actual worksheet generator instead of a detached landing page.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

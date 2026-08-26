import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";

export default function FreePage() {
  return (
    <main>
      <Nav current="Why it's free" />
      <section className="container page-head">
        <p className="kicker">Why it&apos;s free</p>
        <h1>Free forever, and honest about why.</h1>
        <p className="lead">
          Most &ldquo;free&rdquo; tools make you the product. Atom Edu doesn&apos;t.
          Here&apos;s how it stays free without ads, without selling data, and
          without a bill landing on a teacher&apos;s desk.
        </p>
      </section>

      <section className="container section">
        <div className="promise">
          <div className="row">
            <span className="i">01</span>
            <h3>Bring your own key</h3>
            <p>
              Connect your own AI provider key in Settings and your usage is
              unlimited, private, and paid at cost by you, often cents.
              It&apos;s what makes free, unlimited generation actually possible.
              No key? A free shared allowance gets you started.
            </p>
          </div>
          <div className="row">
            <span className="i">02</span>
            <h3>Cheap by design</h3>
            <p>
              Atom uses small models for simple jobs and larger ones only when
              needed, and reuses common work, so the shared free allowance costs
              almost nothing to offer.
            </p>
          </div>
          <div className="row">
            <span className="i">03</span>
            <h3>Funded, not sold</h3>
            <p>
              Grants, education foundations, optional donations, and schools
              that sponsor compute for their teachers keep it running, never
              teacher subscriptions, never advertising.
            </p>
          </div>
          <div className="row">
            <span className="i">04</span>
            <h3>You are not the product</h3>
            <p>
              No ads. No selling data. No training models on student work. Free
              and private are the same promise here.
            </p>
          </div>
          <div className="row">
            <span className="i">05</span>
            <h3>No lock-in</h3>
            <p>
              Everything you create exports in a click. There&apos;s no trap,
              stay because Atom is useful, not because leaving is hard.
            </p>
          </div>
          <div className="row">
            <span className="i">06</span>
            <h3>For every classroom</h3>
            <p>
              Free matters most where budgets are thinnest. Atom is built to
              work in under-resourced, rural, and low-bandwidth schools, not
              just the ones that can pay.
            </p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container section-sm">
          <p className="kicker">The short version</p>
          <h2 style={{ maxWidth: "24ch" }}>
            Free, private, and built to respect your judgment.
          </h2>
          <div className="hero-cta" style={{ marginTop: "26px" }}>
            <a className="btn btn-primary" href="/login?mode=signup">
              Create a free account
            </a>
            <a
              className="btn btn-ghost"
              style={{ color: "var(--paper)", borderColor: "#3a4a40" }}
              href="/legal#privacy"
            >
              Read the privacy terms
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

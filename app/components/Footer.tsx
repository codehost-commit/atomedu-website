export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <div className="footer-brand">
          <span className="logo-mark" aria-hidden="true" />
          atom<span>edu</span>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            margin: "14px 0 0",
            maxWidth: "34ch",
            lineHeight: 1.6,
          }}
        >
          A calm workbench for teachers. Free forever, no ads, no data sold, no
          training on student work.
        </p>
      </div>
      <div className="fcol">
        <b>Product</b>
        <a href="/features">Features</a>
        <a href="/free">Why it&apos;s free</a>
        <a href="/login?mode=signup">Get started</a>
      </div>
      <div className="fcol">
        <b>Company</b>
        <a href="/legal#privacy">Privacy</a>
        <a href="/legal#terms">Terms</a>
        <a href="/legal">Legal</a>
      </div>
      <div className="ftag">
        <span>© Atom Edu · atom-edu.org</span>
        <span>Make the work. Keep the judgment.</span>
      </div>
    </footer>
  );
}

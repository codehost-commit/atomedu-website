import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer-shell">
      <div className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <Link href="/" aria-label="Atom Edu home"><Logo dark /></Link>
            <p>Free assignment tools for teachers. Your classroom materials stay yours.</p>
          </div>
          <div className="footer-column">
            <b>Account</b>
            <a href="/login?mode=signup">Sign up</a>
            <a href="/login">Sign in</a>
            <a href="/use">Use Atom</a>
          </div>
          <div className="footer-column">
            <b>Atom</b>
            <a href="/about">About</a>
            <a href="/features">Features</a>
            <a href="/free">Why it is free</a>
          </div>
          <div className="footer-column">
            <b>Legal</b>
            <a href="/legal#privacy">Privacy</a>
            <a href="/legal#terms">Terms</a>
            <a href="/legal#attributions">Attributions</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Atom Edu. All rights reserved.</span>
          <a href="/legal">Legal information</a>
        </div>
      </div>
    </footer>
  );
}

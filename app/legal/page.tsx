import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";

const EFFECTIVE_DATE = "August 25, 2026";
const ENTITY = "Atom Edu";
const CONTACT_EMAIL = "legal@atom-edu.org";
const GOVERNING_LAW = "the laws that apply where Atom Edu is organized";

export default function LegalPage() {
  return (
    <main>
      <style>{`
 .legal{max-width:820px;margin:auto;padding:90px 28px 110px}
 .legal>.kicker{margin-bottom:14px}
 .legal h1{font-size:clamp(44px,6vw,72px);letter-spacing:0;line-height:.98;margin:0 0 14px}
 .legal.effective{font-size:12px;color:var(--muted);margin:0 0 20px}
 .legal.toc{display:flex;flex-wrap:wrap;gap:8px 18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;margin:0 0 10px}
 .legal.toc a{font:500 12px "DM Sans";color:var(--blue);text-decoration:none}
 .legal.toc a:hover{text-decoration:underline}
 .legal section{border-top:1px solid var(--ink);padding:30px 0 8px}
 .legal h2{font-size:26px;letter-spacing:0;margin:0 0 16px}
 .legal h3{font-size:15px;letter-spacing:0;margin:22px 0 8px}
 .legal p,.legal li{font-size:14px;line-height:1.65;color:#41493f}
 .legal p{margin:0 0 12px}
 .legal ul{padding-left:20px;margin:0 0 12px}
 .legal li{margin:0 0 6px}
 .legal strong{color:var(--ink)}
 .legal.caps{text-transform:none}
 @media(max-width:700px){.legal{padding:60px 20px 80px}}
 `}</style>
      <Nav current="" />
      <article className="legal">
        <p className="kicker">ATOM EDU · LEGAL</p>
        <h1>Privacy, Terms &amp; Attributions</h1>
        <p className="effective">Effective {EFFECTIVE_DATE}</p>

        <nav className="toc" aria-label="On this page">
          <a href="#terms">Terms of Use</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#student-data">Student &amp; Family Data</a>
          <a href="#liability">Disclaimers &amp; Liability</a>
          <a href="#attributions">Attributions</a>
          <a href="#contact">Contact</a>
        </nav>

        <section id="terms">
          <h2>Terms of Use</h2>
          <p>
            These Terms of Use (the &ldquo;Terms&rdquo;) are a binding agreement
            between you and {ENTITY} (&ldquo;{ENTITY},&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;) governing your access to and use of the Atom Edu
            website and workspace (the &ldquo;Service&rdquo;). By accessing or
            using the Service, you agree to these Terms. If you do not agree, do
            not use the Service.
          </p>

          <h3>1. Eligibility and accounts</h3>
          <p>
            The Service is intended for educators and school staff who are at
            least 18 years old and legally able to enter into these Terms. You
            access the Service with an email address and password; you
            are responsible for all activity under your account and for keeping
            your credentials secure.
          </p>

          <h3>2. License to use the Service</h3>
          <p>
            Subject to these Terms, we grant you a limited, non-exclusive,
            non-transferable, revocable license to use the Service for your own
            professional educational purposes. We reserve all rights not
            expressly granted.
          </p>

          <h3>3. Your content</h3>
          <p>
            You retain ownership of the assignments, rubrics, comments, drafts,
            and other materials you create or upload (&ldquo;Your
            Content&rdquo;). You grant us a limited license to host, process,
            and display Your Content solely to operate and provide the Service
            to you. You are responsible for having the rights necessary to
            submit Your Content and for its accuracy and lawfulness.
          </p>

          <h3>4. Acceptable use</h3>
          <p>You agree not to:</p>
          <ul>
            <li>
              use the Service to violate any law, school or district policy, or
              the rights of others;
            </li>
            <li>
              upload unlawful, infringing, or malicious content, or attempt to
              compromise the Service&rsquo;s security or integrity;
            </li>
            <li>
              reverse engineer, scrape, resell, or misuse the Service or access
              it by automated means without our permission; or
            </li>
            <li>
              rely on the Service as a substitute for your own professional
              judgment when scoring, returning, or communicating about student
              work.
            </li>
          </ul>

          <h3>5. Generated output and teacher control</h3>
          <p>
            The Service may generate drafts and suggestions to assist your work.
            Such output can be inaccurate, incomplete, biased, unsuitable for
            a particular classroom, or inconsistent with current standards.{" "}
            <strong>
              Nothing is published, sent, returned, or scored without your
              explicit review and decision.
            </strong>{" "}
            You are solely responsible for any decision you make using the
            Service, including review for accuracy, accessibility, safety,
            copyright, age appropriateness, and compliance with school or
            district requirements.
          </p>

          <h3>6. Intellectual property</h3>
          <p>
            The Service, including its software, design, and trademarks
            (including the Atom Edu name and logo), is owned by {ENTITY} or its
            licensors and is protected by intellectual property laws. These
            Terms grant you no rights in our marks.
          </p>

          <h3>7. Suspension and termination</h3>
          <p>
            We may suspend or terminate your access at any time if you violate
            these Terms or to protect the Service or its users. You may stop
            using the Service at any time. Sections intended to survive
            termination (including ownership, disclaimers, limitation of
            liability, and indemnification) will continue to apply.
          </p>

          <h3>8. No student personal information</h3>
          <p>
            Do not submit student names, student identification numbers,
            contact information, health information, grades, disciplinary
            records, individualized education program information, or other
            directly identifiable student information unless you have written
            authority to do so and an applicable written agreement with Atom
            Edu that specifically permits that use. Use placeholders whenever
            possible. You are responsible for deciding what information may be
            entered into the Service.
          </p>

          <h3>9. Changes</h3>
          <p>
            We may modify the Service or these Terms. If we make material
            changes, we will update the effective date above and, where
            appropriate, provide additional notice. Your continued use after
            changes take effect constitutes acceptance.
          </p>

          <h3>10. Governing law</h3>
          <p>
            These Terms are governed by the laws of {GOVERNING_LAW}, without
            regard to its conflict-of-laws rules. The courts located in that
            jurisdiction will have exclusive jurisdiction over any dispute,
            except where prohibited by applicable law.
          </p>
        </section>

        <section id="privacy">
          <h2>Privacy Policy</h2>
          <p>
            This Privacy Policy explains what information the Service collects,
            how we use it, and the choices you have.
          </p>

          <h3>Information we collect</h3>
          <ul>
            <li>
              <strong>Account information</strong> from your sign-in provider: a
              stable user identifier, your email address, and, when available,
              your display name. We use this to authenticate you and to
              personalize your workspace.
            </li>
            <li>
              <strong>Content you create</strong> in the Service, such as
              assignments, rubrics, comment banks, and drafts.
            </li>
            <li>
              <strong>Usage and device information</strong>, such as log data
              and general technical information needed to operate, secure, and
              improve the Service.
            </li>
          </ul>

          <h3>How we use information</h3>
          <p>
            We use information to provide, secure, maintain, and improve the
            Service; to authenticate users; to communicate with you about the
            Service; and to comply with legal obligations. We do not sell your
            personal information, serve advertising with Your Content, or use
            Your Content to train general-purpose models.
          </p>

          <h3>How information is shared</h3>
          <p>
            We share information only with service providers who help us operate
            the Service (such as hosting and infrastructure) under
            confidentiality obligations, when required by law, or to protect the
            rights and safety of users and the public. We may share information
            in connection with a merger, acquisition, or sale of assets, subject
            to this Policy.
          </p>

          <h3>Retention and security</h3>
          <p>
            We retain information for as long as needed to provide the Service
            and for legitimate business or legal purposes, then delete or
            de-identify it. We use reasonable administrative, technical, and
            organizational safeguards to protect information; however, no method
            of transmission or storage is completely secure.
          </p>

          <h3>Your choices</h3>
          <p>
            You may request access to, correction of, or deletion of your
            personal information, subject to applicable law and legitimate
            retention needs. Contact us using the details below to make a
            request.
          </p>
        </section>

        <section id="student-data">
          <h2>Student &amp; Family Data</h2>
          <p>
            Atom Edu is a teacher-facing workspace. Where you use the Service in
            connection with student records, you and your school or district
            remain responsible for compliance with applicable education-privacy
            laws (such as FERPA in the United States) and any data-protection
            agreement between your institution and {ENTITY}. To the extent we
            process student education records on your institution&rsquo;s
            behalf, we act as a school official / service provider under your
            direction, use that data only to provide the Service, and do not use
            it for any unrelated purpose. Please avoid entering more student
            personal information than your task requires.
          </p>
        </section>

        <section id="liability">
          <h2>Disclaimers &amp; Limitation of Liability</h2>
          <p className="caps">
            <strong>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind, whether express,
              implied, or statutory, including any implied warranties of
              merchantability, fitness for a particular purpose, accuracy, and
              non-infringement. We do not warrant that the Service will be
              uninterrupted, error-free, or that any output will be accurate or
              suitable for a given use.
            </strong>
          </p>
          <p className="caps">
            <strong>
              To the maximum extent permitted by law, {ENTITY} and its suppliers
              will not be liable for any indirect, incidental, special,
              consequential, exemplary, or punitive damages, or for any loss of
              data, profits, or goodwill, arising out of or related to your use
              of the Service. Our total liability for all claims relating to the
              Service will not exceed one hundred U.S. dollars (US $100) or the
              amount you paid us for the Service in the twelve months before the
              claim, whichever is greater.
            </strong>
          </p>
          <p>
            Some jurisdictions do not allow certain exclusions or limitations,
            so some of the above may not apply to you. Nothing in these Terms
            limits liability that cannot be limited under applicable law.
          </p>
          <p>
            You agree that any claim arising from or relating to the Service
            must be brought within one year after the claim arose, unless a
            longer period is required by applicable law. You agree to bring a
            claim only on an individual basis and not as a plaintiff or class
            member in any class, consolidated, or representative action, to the
            extent permitted by law.
          </p>
          <h3>Indemnification</h3>
          <p>
            You agree to indemnify and hold harmless {ENTITY} and its officers,
            employees, and agents from any claims, damages, and expenses
            (including reasonable legal fees) arising out of your misuse of the
            Service, Your Content, or your violation of these Terms or
            applicable law.
          </p>
        </section>

        <section id="attributions">
          <h2>Attributions</h2>
          <p>
            The Atom Edu logo displayed on this site was supplied by the site
            owner. Mathematics is typeset with KaTeX. Typography is served
            through Google Fonts (DM Sans and DM Mono). Product and company
            names referenced on this site may be trademarks of their respective
            owners.
          </p>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <p>
            Questions about these Terms or this Privacy Policy, or requests
            regarding your information, can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </article>
      <Footer />
    </main>
  );
}

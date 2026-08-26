import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";

export default function UsePage() {
  return (
    <main>
      <Nav current="How it works" />
      <section className="container page-head">
        <p className="kicker">Use Atom</p>
        <h1>Make a worksheet in a few clear steps.</h1>
        <p className="lead">Create an account with your email and password. Then make, review, save, and download your assignments from one place.</p>
      </section>
      <section className="container section">
        <div className="use-steps">
          <article><span>1</span><div><h2>Start with your class</h2><p>Add the topic, level, paper type, number of questions, and any details that matter.</p></div></article>
          <article><span>2</span><div><h2>Choose diagrams and question types</h2><p>Ask for multiple choice, short answer, extended response, graphs, tables, or labeled science diagrams.</p></div></article>
          <article><span>3</span><div><h2>Read the whole draft</h2><p>Check the content, answer key, notation, and instructions. Change anything that needs your judgment.</p></div></article>
          <article><span>4</span><div><h2>Save and download</h2><p>Keep assignments in your library and download the printable PDF when it is ready.</p></div></article>
        </div>
        <div className="hero-cta"><a className="btn btn-primary" href="/login?mode=signup">Sign up</a><a className="btn btn-ghost" href="/login">Sign in</a></div>
      </section>
      <Footer />
    </main>
  );
}

import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { Logo } from "../components/Logo";

export default function AboutPage() {
  return (
    <main>
      <Nav current="About" />
      <section className="container about-hero">
        <p className="kicker">About Atom Edu</p>
        <Logo />
        <h1>Practical help for the work teachers do every day.</h1>
        <p className="lead">Atom Edu is a free assignment maker for teachers. It helps turn a clear teaching goal into a worksheet, quiz, review, or handout that you can inspect, revise, save, and print.</p>
      </section>
      <section className="container section about-copy">
        <div><h2>What we are building</h2><p>Teachers should be able to prepare materials without paying another subscription or handing classroom work to an advertising system. Atom starts with assignments because they are one of the most repeated jobs in a school week.</p></div>
        <div><h2>How it is meant to be used</h2><p>Give Atom the class level, topic, requirements, and question mix. It prepares a draft. You decide whether the content is correct, appropriate, and ready for your students.</p></div>
        <div><h2>What stays with you</h2><p>Your account holds your saved work. Atom does not sell your personal information or classroom materials. Read the full details in the Privacy Policy and Terms of Use.</p></div>
      </section>
      <Footer />
    </main>
  );
}

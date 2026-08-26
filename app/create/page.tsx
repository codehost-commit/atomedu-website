import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { requireUser } from "../lib/auth";
import { CreateForm } from "../components/CreateForm";

export default async function CreatePage() {
  await requireUser("/create");
  return (
    <main>
      <Nav current="Create" />
      <section className="container page-head">
        <p className="kicker">Create</p>
        <h1>Draft something new.</h1>
        <p className="lead">
          Describe what you need. Atom writes the first draft; you review, edit,
          and approve.
        </p>
      </section>
      <section className="container section-sm">
        <CreateForm signedIn />
      </section>
      <Footer />
    </main>
  );
}

import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { requireUser } from "../lib/auth";
import { listAssignments } from "../lib/assignments";

export default async function Assignments() {
  const user = await requireUser("/assignments");
  const rows = await listAssignments(user.id);
  return (
    <main>
      <Nav current="Assignments" />
      <section className="container page-head assignments-head">
        <div>
          <p className="kicker">Assignments</p>
          <h1>Your saved work.</h1>
          <p className="lead">Every assignment you save is listed here.</p>
        </div>
        <a className="btn btn-primary" href="/create">Create assignment</a>
      </section>
      <section className="container section-sm">
        {rows.length === 0 ? (
          <div className="assignments-empty">
            <h2>Nothing saved yet.</h2>
            <p>Make an assignment, review it, and select Save to keep it here.</p>
            <a className="btn btn-primary" href="/create">Create assignment</a>
          </div>
        ) : (
          <div className="assignment-list">
            {rows.map((assignment) => (
              <a className="assignment-row" href={`/assignments/${assignment.id}`} key={assignment.id}>
                <div>
                  <h2>{assignment.title}</h2>
                  <p>{assignment.prompt || "No original request saved."}</p>
                </div>
                <div className="assignment-meta"><span>{assignment.kind}</span><span>{assignment.createdAt}</span></div>
              </a>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "../../components/Footer";
import { Nav } from "../../components/Nav";
import { WorksheetPreview } from "../../components/MathText";
import { requireUser } from "../../lib/auth";
import { getAssignment } from "../../lib/assignments";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/assignments");
  const { id } = await params;
  const assignment = await getAssignment(user.id, id);
  if (!assignment) notFound();

  return (
    <main>
      <Nav current="Assignments" />
      <section className="container page-head assignment-detail-head">
        <div>
          <Link className="back-link" href="/assignments">All assignments</Link>
          <p className="kicker">{assignment.kind}</p>
          <h1>{assignment.title}</h1>
        </div>
        <a className="btn btn-ghost" href="/create">Create another</a>
      </section>
      <section className="container section-sm assignment-detail-paper">
        <WorksheetPreview content={assignment.content} />
      </section>
      <Footer />
    </main>
  );
}

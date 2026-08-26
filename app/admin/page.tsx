import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { AdminUserActions } from "../components/AdminUserActions";
import { requireAdmin } from "../lib/auth";
import { getAdminStats, listUsers } from "../lib/admin";

export default async function AdminPage() {
  await requireAdmin();
  const [stats, people] = await Promise.all([getAdminStats(), listUsers(200)]);

  const cards: [string, number][] = [
    ["Total users", stats.totalUsers],
    ["With password", stats.passwordUsers],
    ["Magic-link only", stats.magicOnlyUsers],
    ["New this week", stats.newUsers7d],
    ["Active sessions", stats.activeSessions],
    ["Pending links", stats.pendingMagicLinks],
  ];

  return (
    <main>
      <style>{`
 .admin{max-width:1180px;margin:auto;padding:64px 28px 110px}
 .admin h1{font-size:clamp(40px,5vw,64px);letter-spacing:0;line-height:.98;margin:0 0 6px}
 .admin>p.sub{font-size:14px;color:var(--muted);margin:0 0 34px}
 .admin h2{font-size:24px;letter-spacing:0;margin:46px 0 16px}
 .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
 .stat{border:1px solid var(--line);background:#fff;padding:20px}
 .stat b{display:block;font:600 34px "DM Sans";letter-spacing:0;color:var(--ink)}
 .stat span{font:500 10px "DM Mono";letter-spacing:.5px;color:var(--muted);text-transform:uppercase}
 .user-table{border-top:1px solid var(--ink)}
 .ut-head,.ut-row{display:grid;grid-template-columns:2fr 1.3fr 1.3fr .9fr .8fr 1.2fr;gap:12px;align-items:center;padding:14px 8px}
 .ut-head{font:500 9px "DM Mono";letter-spacing:.5px;color:var(--muted);text-transform:uppercase;background:#fbfaf6}
 .ut-row{border-bottom:1px solid var(--line);font-size:13px}
 .ut-row.email{font-weight:500;word-break:break-all}
 .ut-row.muted{color:var(--muted);font-size:12px}
 .pill{display:inline-block;font:600 10px "DM Mono";padding:3px 7px;border:1px solid var(--line)}
 .pill.pw{color:var(--green)}.pill.magic{color:var(--blue)}
 .admin-actions{display:flex;gap:8px;justify-content:flex-end}
 .admin-actions button{border:0;background:var(--ink);color:#fff;font:600 11px "DM Sans";padding:7px 10px;cursor:pointer}
 .admin-actions button.danger{background:var(--red)}
 .admin-actions button:disabled{opacity:.5;cursor:default}
 .admin-empty{padding:40px 8px;color:var(--muted);font-size:13px;border-bottom:1px solid var(--line)}
 @media(max-width:820px){.stat-grid{grid-template-columns:repeat(2,1fr)}.ut-head{display:none}.ut-row{grid-template-columns:1fr;gap:5px;padding:16px 8px}.admin-actions{justify-content:flex-start;margin-top:8px}}
 `}</style>
      <Nav current="" />
      <section className="admin">
        <p className="kicker">ADMIN</p>
        <h1>Dashboard</h1>
        <p className="sub">
          Accounts and sessions for Atom Edu. Visible only to admins.
        </p>

        <div className="stat-grid">
          {cards.map(([label, value]) => (
            <div className="stat" key={label}>
              <b>{value}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <h2>Users ({people.length})</h2>
        <div className="user-table">
          <div className="ut-head">
            <span>Email</span>
            <span>Name</span>
            <span>Signed up (UTC)</span>
            <span>Method</span>
            <span>Sessions</span>
            <span></span>
          </div>
          {people.length === 0 && (
            <div className="admin-empty">
              No users yet. Create one from the sign-in page.
            </div>
          )}
          {people.map((u) => (
            <div className="ut-row" key={u.id}>
              <span className="email">{u.email}</span>
              <span className="muted">{u.name ?? ", "}</span>
              <span className="muted">{u.createdAt}</span>
              <span>
                <i className={`pill ${u.hasPassword ? "pw" : "magic"}`}>
                  {u.hasPassword ? "Password" : "Magic"}
                </i>
              </span>
              <span className="muted">{u.activeSessions}</span>
              <AdminUserActions userId={u.id} email={u.email} />
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
